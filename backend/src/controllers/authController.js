const crypto = require('crypto');
const userModel = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');
const appEvents = require('../utils/eventEmitter');

function hashToken(token) {
  // We never store raw refresh tokens — only a hash, same principle as passwords.
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await userModel.findUserByEmail(email);
    if (existing) throw new ApiError(409, 'An account with that email already exists');

    const passwordHash = await hashPassword(password);
    const user = await userModel.createUser({ name, email, passwordHash });

    appEvents.emit('user:registered', user);

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findUserByEmail(email);
    // Same error message whether the email doesn't exist or the password is
    // wrong — don't leak which one it was (prevents user enumeration).
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new ApiError(401, 'Invalid email or password');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await userModel.saveRefreshToken(user.id, hashToken(refreshToken), refreshExpiryDate());

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, 'refreshToken is required');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const stored = await userModel.findValidRefreshToken(payload.sub, hashToken(refreshToken));
    if (!stored) throw new ApiError(401, 'Refresh token was revoked or not recognized');

    // Rotate: issue a brand new access token (refresh token itself is reused
    // until it expires — a stricter setup would rotate + revoke it here too).
    const newAccessToken = signAccessToken({ sub: payload.sub, email: payload.email, role: payload.role });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await userModel.revokeRefreshToken(hashToken(refreshToken));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findUserById(req.user.id);
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
