require('dotenv').config(); // Carga el archivo .env

module.exports = {
  apps: [
    {
      name: 'ferreteriav2',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3001',
      instances: 1, 
      instances: 'max',        
      exec_mode: 'cluster',    
      max_memory_restart: '1500M',
      autorestart: true,
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST === 'true', // Evalúa si es true o false
        AUTH_URL: process.env.AUTH_URL,
        RENIEC_TOKEN: process.env.RENIEC_TOKEN,
        NEXTAUTH_URL: process.env.AUTH_URL, // Ajustar NEXTAUTH_URL a AUTH_URL si es el mismo valor
        NEXT_PUBLIC_REVERB_APP_KEY: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
        NEXT_PUBLIC_REVERB_HOST: process.env.NEXT_PUBLIC_REVERB_HOST,
        NEXT_PUBLIC_REVERB_PORT: process.env.NEXT_PUBLIC_REVERB_PORT,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        PORT: 3001,
      },
    },
  ],
};