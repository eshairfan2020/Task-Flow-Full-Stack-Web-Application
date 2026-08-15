// EventEmitter the pattern underneath most of Node's core APIs
// (http servers, streams, etc).
const { EventEmitter } = require('events');

class AppEvents extends EventEmitter {}
const appEvents = new AppEvents();

// Listeners registered once, at startup, in server.js
appEvents.on('task:created', (task) => {
  console.log(`[event] task:created -> #${task.id} "${task.title}"`);
});

appEvents.on('task:statusChanged', ({ taskId, from, to }) => {
  console.log(`[event] task:statusChanged -> #${taskId} ${from} -> ${to}`);
});

appEvents.on('user:registered', (user) => {
  console.log(`[event] user:registered -> ${user.email}`);
});

module.exports = appEvents;
