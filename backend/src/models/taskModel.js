const pool = require('../config/db');

// ---- CRUD: Create ----
async function createTask({ teamId, title, description, priority, assigneeId, createdBy, dueDate }) {
  const [result] = await pool.query(
    `INSERT INTO tasks (team_id, title, description, priority, assignee_id, created_by, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [teamId, title, description || null, priority || 'medium', assigneeId || null, createdBy, dueDate || null]
  );
  return getTaskById(result.insertId);
}

// ---- CRUD: Read (single) ----
async function getTaskById(id) {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return rows[0] || null;
}

// ---- CRUD: Read (list) — WHERE + LEFT JOIN + ORDER BY ----
async function listTasksForTeam(teamId, { status } = {}) {
  const params = [teamId];
  let sql = `
    SELECT t.*, u.name AS assignee_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.team_id = ?`;

  if (status) {
    sql += ' AND t.status = ?';
    params.push(status);
  }

  sql += ` ORDER BY FIELD(t.priority, 'high', 'medium', 'low'), t.due_date IS NULL, t.due_date ASC`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

// ---- CRUD: Update ----
async function updateTask(id, fields) {
  const allowed = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }
  if (!sets.length) return getTaskById(id);

  params.push(id);
  await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params);
  return getTaskById(id);
}

// ---- CRUD: Delete ----
async function deleteTask(id) {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// ---- GROUP BY + HAVING: workload report per assignee ----
async function overloadedMembers(teamId, threshold = 5) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, COUNT(*) AS open_tasks
     FROM tasks t
     JOIN users u ON u.id = t.assignee_id
     WHERE t.team_id = ? AND t.status != 'done'
     GROUP BY u.id, u.name
     HAVING COUNT(*) > ?
     ORDER BY open_tasks DESC`,
    [teamId, threshold]
  );
  return rows;
}

// ---- Comments (1-to-many) ----
async function addComment(taskId, userId, body) {
  const [result] = await pool.query(
    'INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)',
    [taskId, userId, body]
  );
  return { id: result.insertId, taskId, userId, body };
}

async function listComments(taskId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.body, c.created_at, u.name AS author
     FROM task_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,
    [taskId]
  );
  return rows;
}

module.exports = {
  createTask,
  getTaskById,
  listTasksForTeam,
  updateTask,
  deleteTask,
  overloadedMembers,
  addComment,
  listComments,
};
