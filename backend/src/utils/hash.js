// Hashing vs Encryption:
// - Hashing (bcrypt) is one-way — used for passwords. You never "decrypt" a
//   password hash, you only re-hash the login attempt and compare.
// - Encryption is two-way (needs a key to reverse) — used for data you must
//   read back later (not used for passwords here).
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
