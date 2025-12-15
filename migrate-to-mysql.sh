#!/bin/bash
# Script de migración de PostgreSQL a MySQL
# Ejecutar desde la raíz del proyecto

echo "🚀 Iniciando migración de PostgreSQL a MySQL..."

echo "📋 Paso 1: Respaldando configuración actual..."
cp .env .env.backup
echo "✅ Backup creado en .env.backup"

echo "📋 Paso 2: Instalando dependencias de MySQL..."
npm install mysql2

echo "📋 Paso 3: Eliminando migraciones anteriores..."
rm -rf prisma/migrations/*
echo "✅ Migraciones de PostgreSQL eliminadas"

echo "📋 Paso 4: Generando nueva migración para MySQL..."
npx prisma migrate dev --name init_mysql

echo "📋 Paso 5: Generando cliente Prisma..."
npx prisma generate

echo "📋 Paso 6: Verificando conexión a base de datos..."
npx prisma db push

echo "🎉 ¡Migración completada!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Actualiza tu archivo .env con la configuración MySQL"
echo "2. Ejecuta 'npm run seed' si tienes datos de prueba"
echo "3. Prueba la aplicación"
echo ""
echo "💡 Si encuentras errores, restaura con: cp .env.backup .env"