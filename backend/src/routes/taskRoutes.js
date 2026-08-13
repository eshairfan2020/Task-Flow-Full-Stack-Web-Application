const express = require('express');
const taskController = require('../controllers/taskController');
const fileController = require('../controllers/fileController');
const { authenticate, authorize } = require('../middleware/auth');
const { sanitizeBody, requireFields } = require('../middleware/validate');
const upload = require('../config/multer');

const router = express.Router();

router.use(authenticate);

// ---- REST resource: /teams/:teamId/tasks ----
router.get('/teams/:teamId/tasks', taskController.listTasks);
router.post('/teams/:teamId/tasks', sanitizeBody, requireFields('title'), taskController.createTask);
router.get('/teams/:teamId/tasks/export.csv', fileController.exportTasksCsv);
router.get('/teams/:teamId/tasks/workload', taskController.workloadReport);

router.patch('/tasks/:taskId', sanitizeBody, taskController.updateTask);
// Only admins may hard-delete a task — RBAC example at the route level.
router.delete('/tasks/:taskId', authorize('admin'), taskController.deleteTask);

router.get('/tasks/:taskId/comments', taskController.listComments);
router.post('/tasks/:taskId/comments', sanitizeBody, requireFields('body'), taskController.addComment);

router.post('/tasks/:taskId/attachments', upload.single('file'), fileController.uploadAttachment);
router.get('/attachments/:filename/download', fileController.downloadAttachment);

module.exports = router;
