// Started from /apps/fe-suara/current (symlink to the active release).
// Secrets come from /apps/fe-suara/shared/.env via Node's --env-file, not from this repo.
module.exports = {
  apps: [
    {
      name: 'suara',
      script: 'server.js',
      cwd: '/apps/fe-suara/current',
      // One process: the booth/queue state is not shareable across cluster workers,
      // and a small VPS gains nothing from 'max' instances.
      instances: 1,
      exec_mode: 'fork',
      node_args: '--env-file=/apps/fe-suara/shared/.env --max-old-space-size=256',
      max_memory_restart: '320M',
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
        HOSTNAME: '127.0.0.1', // reachable only through nginx
      },
    },
  ],
};
