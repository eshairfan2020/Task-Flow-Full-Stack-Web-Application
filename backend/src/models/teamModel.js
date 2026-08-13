const pool = require('../config/db');

async function createTeam({ name, ownerId }) {
  const [result] = await pool.query(
    'INSERT INTO teams (name, owner_id) VALUES (?, ?)',
    [name, ownerId]
  );
  await pool.query(
    'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
    [result.insertId, ownerId]
  );
  return { id: result.insertId, name, ownerId };
}

async function addMember(teamId, userId) {
  await pool.query(
    'INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
    [teamId, userId]
  );
}

async function isMember(teamId, userId) {
  const [rows] = await pool.query(
    'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?',
    [teamId, userId]
  );
  return rows.length > 0;
}

async function listTeamsForUser(userId) {
  // JOIN across the junction table to find every team a user belongs to.
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.owner_id, t.created_at
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = ?
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows;
}

async function listMembers(teamId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role
     FROM users u
     JOIN team_members tm ON tm.user_id = u.id
     WHERE tm.team_id = ?`,
    [teamId]
  );
  return rows;
}

module.exports = { createTeam, addMember, isMember, listTeamsForUser, listMembers };
