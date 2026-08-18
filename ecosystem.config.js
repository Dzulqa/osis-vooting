module.exports = {
  apps: [
    {
      name: 'suara',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/deploy/apps/fe-suara',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        PORT: 3008,
        NODE_ENV: 'production',
      },
    },
  ],
};
