// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'ferreteriav2',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3001',
      instances: 1,
      exec_mode: 'fork',
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_TRUST_HOST: TRUE,
        AUTH_URL: process.env.AUTH_URL,
        RENIEC_TOKEN: process.env.RENIEC_TOKEN,
        NEXTAUTH_URL: 'http://62.171.147.202',
        PORT: 3001,
      },
    },
  ],
}
