const express = require('express');
const teamController = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');
const { sanitizeBody, requireFields } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate); // every route below requires a valid access token

router.post('/', sanitizeBody, requireFields('name'), teamController.createTeam);
router.get('/', teamController.myTeams);
router.get('/:teamId/members', teamController.listMembers);
router.post('/:teamId/members', requireFields('userId'), teamController.addMember);

module.exports = router;
