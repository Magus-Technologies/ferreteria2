// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'ferreteria',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
      },
    },
  ],
}
