// EventEmitter — the pattern underneath most of Node's core APIs
// (http servers, streams, etc). We use it here to decouple "a task was
// created" from "what happens next" (e.g. logging, notifying, future
// webhook dispatch) — see Decoupling / Loose Coupling in the README.
const { EventEmitter } = require('events');

class AppEvents extends EventEmitter {}
const appEvents = new AppEvents();

// Listeners registered once, at startup, in server.js
appEvents.on('task:created', (task) => {
  console.log(`[event] task:created -> #${task.id} "${task.title}"`);
  // In a real system this is where you'd publish to a message queue
  // (RabbitMQ/Kafka) or fire a webhook — see README "Next steps".
});

appEvents.on('task:statusChanged', ({ taskId, from, to }) => {
  console.log(`[event] task:statusChanged -> #${taskId} ${from} -> ${to}`);
});

appEvents.on('user:registered', (user) => {
  console.log(`[event] user:registered -> ${user.email}`);
});

module.exports = appEvents;
