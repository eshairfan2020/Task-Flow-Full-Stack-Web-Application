// PM2 process manager config.
// Run in production with:  pm2 start ecosystem.config.js
// `instances: 'max'` + `exec_mode: 'cluster'` spins up one process per CPU
// core, each with its own event loop, and PM2 load-balances requests across
// them — this is how a single-threaded Node app scales across cores.
// Auto-restart on crash, and zero-downtime reloads with `pm2 reload`.
module.exports = {
  apps: [
    {
      name: 'taskflow-api',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
