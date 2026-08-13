import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
];

export default function Dashboard() {
  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Load the user's teams once on mount.
  useEffect(() => {
    apiFetch('/teams')
      .then((data) => {
        setTeams(data.teams);
        if (data.teams.length) setTeamId(data.teams[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Reload tasks whenever the selected team changes.
  const loadTasks = useCallback(async () => {
    if (!teamId) { setTasks([]); return; }
    setLoading(true);
    try {
      const data = await apiFetch(`/teams/${teamId}/tasks`);
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // useMemo: grouping + sorting only re-runs when `tasks` actually changes,
  // not on every render (e.g. when the "new task" form's local state updates).
  const columns = useMemo(() => {
    const grouped = { todo: [], in_progress: [], done: [] };
    for (const task of tasks) {
      (grouped[task.status] || grouped.todo).push(task);
    }
    return grouped;
  }, [tasks]);

  // useCallback: stable reference so <TaskCard> (wrapped in React.memo)
  // doesn't re-render every sibling just because this function was
  // redefined on each Dashboard render.
  const handleCardClick = useCallback((task) => setEditingTask(task), []);

  async function handleCreateTeam(e) {
    e.preventDefault();
    const data = await apiFetch('/teams', { method: 'POST', body: JSON.stringify({ name: newTeamName }) });
    setTeams((prev) => [data.team, ...prev]);
    setTeamId(data.team.id);
    setNewTeamName('');
    setShowNewTeam(false);
  }

  async function handleCreateTask(values) {
    await apiFetch(`/teams/${teamId}/tasks`, { method: 'POST', body: JSON.stringify(values) });
    setShowNewTask(false);
    await loadTasks();
  }

  async function handleUpdateTask(values) {
    await apiFetch(`/tasks/${editingTask.id}`, { method: 'PATCH', body: JSON.stringify(values) });
    setEditingTask(null);
    await loadTasks();
  }

  async function handleDeleteTask() {
    await apiFetch(`/tasks/${editingTask.id}`, { method: 'DELETE' });
    setEditingTask(null);
    await loadTasks();
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container">
        <h1>Hey {user?.name?.split(' ')[0]} 👋</h1>
        <p className="subtitle">Here's what your team is working on.</p>

        <div className="toolbar">
          <select
            className="team-select"
            value={teamId || ''}
            onChange={(e) => setTeamId(Number(e.target.value))}
          >
            {teams.length === 0 && <option value="">No teams yet</option>}
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => setShowNewTeam((v) => !v)}>+ Team</button>
            <button className="btn btn-primary" onClick={() => setShowNewTask(true)} disabled={!teamId}>
              + Task
            </button>
          </div>
        </div>

        {showNewTeam && (
          <div className="card" style={{ marginBottom: 20 }}>
            <form onSubmit={handleCreateTeam} className="form-row" style={{ alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="teamName">Team name</label>
                <input id="teamName" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {showNewTask && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2>New task</h2>
            <TaskForm onSubmit={handleCreateTask} onCancel={() => setShowNewTask(false)} />
          </div>
        )}

        {editingTask && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2>Edit task</h2>
            <TaskForm initial={editingTask} onSubmit={handleUpdateTask} onCancel={() => setEditingTask(null)} />
            {user?.role === 'admin' && (
              <button className="btn btn-danger" style={{ marginTop: 12 }} onClick={handleDeleteTask}>
                Delete task
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading-text">Loading tasks…</div>
        ) : (
          <div className="board">
            {COLUMNS.map((col) => (
              <div key={col.key}>
                <div className="column-header">
                  <span>{col.label}</span>
                  <span className="column-count">{columns[col.key].length}</span>
                </div>
                {columns[col.key].length === 0 && <div className="empty-state">Nothing here</div>}
                {columns[col.key].map((task) => (
                  <TaskCard key={task.id} task={task} onClick={handleCardClick} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
