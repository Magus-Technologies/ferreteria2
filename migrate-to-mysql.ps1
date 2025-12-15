# Script de migración de PostgreSQL a MySQL para Windows PowerShell
# Ejecutar desde la raíz del proyecto con: .\migrate-to-mysql.ps1

Write-Host "🚀 Iniciando migración de PostgreSQL a MySQL..." -ForegroundColor Green

Write-Host "📋 Paso 1: Respaldando configuración actual..." -ForegroundColor Yellow
Copy-Item ".env" ".env.backup" -ErrorAction SilentlyContinue
Write-Host "✅ Backup creado en .env.backup" -ForegroundColor Green

Write-Host "📋 Paso 2: Instalando dependencias de MySQL..." -ForegroundColor Yellow
npm install mysql2

Write-Host "📋 Paso 3: Eliminando migraciones anteriores..." -ForegroundColor Yellow
Remove-Item "prisma\migrations\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Migraciones de PostgreSQL eliminadas" -ForegroundColor Green

Write-Host "📋 Paso 4: Generando nueva migración para MySQL..." -ForegroundColor Yellow
npx prisma migrate dev --name init_mysql

Write-Host "📋 Paso 5: Generando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate

Write-Host "📋 Paso 6: Verificando conexión a base de datos..." -ForegroundColor Yellow
npx prisma db push

Write-Host "🎉 ¡Migración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Actualiza tu archivo .env con la configuración MySQL" -ForegroundColor White
Write-Host "2. Ejecuta 'npm run seed' si tienes datos de prueba" -ForegroundColor White
Write-Host "3. Prueba la aplicación" -ForegroundColor White
Write-Host ""
Write-Host "💡 Si encuentras errores, restaura con: Copy-Item '.env.backup' '.env'" -ForegroundColor Yellow