// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'ferreteriav2',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
        AUTH_URL: process.env.AUTH_URL,
        RENIEC_TOKEN: process.env.RENIEC_TOKEN,
        PORT: 3001,
      },
    },
  ],
}
