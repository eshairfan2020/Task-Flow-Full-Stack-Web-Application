// Every query uses `?` placeholders — mysql2 escapes the values for us.
// SQL Injection prevention: NEVER string-concatenate user input into SQL.
//   BAD:  `SELECT * FROM users WHERE email = '${email}'`
//   GOOD: pool.query('SELECT * FROM users WHERE email = ?', [email])
const pool = require('../config/db');

async function createUser({ name, email, passwordHash, role = 'member' }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return { id: result.insertId, name, email, role };
}

async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function saveRefreshToken(userId, tokenHash, expiresAt) {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
}

async function findValidRefreshToken(userId, tokenHash) {
  const [rows] = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE user_id = ? AND token_hash = ? AND revoked = FALSE AND expires_at > NOW()`,
    [userId, tokenHash]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(tokenHash) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ?', [tokenHash]);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
};
