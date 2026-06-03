// pm2 process definition for the Lazarus Next.js app (runs as deploy, loopback :3001).
module.exports = {
  apps: [
    {
      name: 'lazarus',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3001 -H 127.0.0.1',
      cwd: '/opt/vrroom/lazarus',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      env: { NODE_ENV: 'production' }
    }
  ]
};
