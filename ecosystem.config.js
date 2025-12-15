require('dotenv').config(); // Carga el archivo .env

module.exports = {
  apps: [
    {
      name: 'ferreteriav2',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3001',
      instances: 1, 
      exec_mode: 'fork',
      max_memory_restart: '500M',
      autorestart: true,
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST === 'true', // Evalúa si es true o false
        AUTH_URL: process.env.AUTH_URL,
        RENIEC_TOKEN: process.env.RENIEC_TOKEN,
        NEXTAUTH_URL: process.env.AUTH_URL, // Ajustar NEXTAUTH_URL a AUTH_URL si es el mismo valor
        PORT: 3001,
      },
    },
  ],
};