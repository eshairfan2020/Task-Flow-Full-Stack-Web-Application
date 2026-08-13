const fs = require('fs');
const path = require('path');
const taskModel = require('../models/taskModel');
const { ApiError } = require('../middleware/errorHandler');

// multer handles multipart/form-data uploads and puts the file on req.file.
async function uploadAttachment(req, res, next) {
  try {
    if (!req.file) throw new ApiError(400, 'No file uploaded (field name must be "file")');
    res.status(201).json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    next(err);
  }
}

// Streams: instead of building the whole CSV string in memory and sending it
// in one go, we write row-by-row straight to the HTTP response stream.
// For a huge task list this keeps memory flat instead of growing with size.
async function exportTasksCsv(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const tasks = await taskModel.listTasksForTeam(teamId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="team-${teamId}-tasks.csv"`);

    res.write('id,title,status,priority,assignee,due_date\n');
    for (const t of tasks) {
      const row = [t.id, csvEscape(t.title), t.status, t.priority, csvEscape(t.assignee_name || ''), t.due_date || '']
        .join(',');
      res.write(row + '\n'); // streamed chunk by chunk, not buffered
    }
    res.end();
  } catch (err) {
    next(err);
  }
}

function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Explicit fs.createReadStream example (separate from express.static, which
// does this internally). Streaming a file in chunks means we never load
// the whole thing into memory, even for a large attachment.
function downloadAttachment(req, res, next) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return next(new ApiError(404, 'File not found'));
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => next(err));
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  stream.pipe(res); // pipe = read + write chunks as they arrive, backpressure handled for us
}

module.exports = { uploadAttachment, exportTasksCsv, downloadAttachment };
