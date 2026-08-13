const taskModel = require('../models/taskModel');
const teamModel = require('../models/teamModel');
const { ApiError } = require('../middleware/errorHandler');
const { getOrSetCache, invalidate } = require('../utils/cache');
const appEvents = require('../utils/eventEmitter');

async function assertMembership(teamId, userId) {
  const member = await teamModel.isMember(teamId, userId);
  if (!member) throw new ApiError(403, 'You are not a member of this team');
}

async function createTask(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    await assertMembership(teamId, req.user.id);

    const task = await taskModel.createTask({
      teamId,
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      assigneeId: req.body.assigneeId,
      createdBy: req.user.id,
      dueDate: req.body.dueDate,
    });

    appEvents.emit('task:created', task);
    await invalidate(`tasks:team:${teamId}:*`); // cache is now stale, drop it

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

// Cache-aside read: identical (teamId, status) requests within the TTL
// window are served from Redis instead of hitting MySQL again.
async function listTasks(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    await assertMembership(teamId, req.user.id);

    const status = req.query.status || 'all';
    const cacheKey = `tasks:team:${teamId}:status:${status}`;

    const { data, fromCache } = await getOrSetCache(cacheKey, 30, () =>
      taskModel.listTasksForTeam(teamId, { status: status === 'all' ? undefined : status })
    );

    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json({ tasks: data });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const taskId = Number(req.params.taskId);
    const existing = await taskModel.getTaskById(taskId);
    if (!existing) throw new ApiError(404, 'Task not found');
    await assertMembership(existing.team_id, req.user.id);

    const updated = await taskModel.updateTask(taskId, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assignee_id: req.body.assigneeId,
      due_date: req.body.dueDate,
    });

    if (req.body.status && req.body.status !== existing.status) {
      appEvents.emit('task:statusChanged', {
        taskId,
        from: existing.status,
        to: req.body.status,
      });
    }

    await invalidate(`tasks:team:${existing.team_id}:*`);
    res.json({ task: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const taskId = Number(req.params.taskId);
    const existing = await taskModel.getTaskById(taskId);
    if (!existing) throw new ApiError(404, 'Task not found');
    await assertMembership(existing.team_id, req.user.id);

    await taskModel.deleteTask(taskId);
    await invalidate(`tasks:team:${existing.team_id}:*`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const taskId = Number(req.params.taskId);
    const task = await taskModel.getTaskById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');
    await assertMembership(task.team_id, req.user.id);

    const comment = await taskModel.addComment(taskId, req.user.id, req.body.body);
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

async function listComments(req, res, next) {
  try {
    const taskId = Number(req.params.taskId);
    const comments = await taskModel.listComments(taskId);
    res.json({ comments });
  } catch (err) {
    next(err);
  }
}

async function workloadReport(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    await assertMembership(teamId, req.user.id);
    const threshold = Number(req.query.threshold) || 5;
    const rows = await taskModel.overloadedMembers(teamId, threshold);
    res.json({ overloaded: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  addComment,
  listComments,
  workloadReport,
};
