const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { sanitizeBody, requireFields } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', sanitizeBody, requireFields('name', 'email', 'password'), authController.register);
router.post('/login', loginLimiter, sanitizeBody, requireFields('email', 'password'), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
