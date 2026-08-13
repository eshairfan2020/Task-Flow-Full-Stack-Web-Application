const teamModel = require('../models/teamModel');
const { ApiError } = require('../middleware/errorHandler');

async function createTeam(req, res, next) {
  try {
    const team = await teamModel.createTeam({ name: req.body.name, ownerId: req.user.id });
    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
}

async function myTeams(req, res, next) {
  try {
    const teams = await teamModel.listTeamsForUser(req.user.id);
    res.json({ teams });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const { userId } = req.body;

    const requesterIsMember = await teamModel.isMember(teamId, req.user.id);
    if (!requesterIsMember) throw new ApiError(403, 'You are not a member of this team');

    await teamModel.addMember(teamId, userId);
    const members = await teamModel.listMembers(teamId);
    res.status(201).json({ members });
  } catch (err) {
    next(err);
  }
}

async function listMembers(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const members = await teamModel.listMembers(teamId);
    res.json({ members });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTeam, myTeams, addMember, listMembers };
