'use server'

// NOTA: Esta función está temporalmente deshabilitada porque la autenticación
// ahora se maneja con Laravel Sanctum y no hay sesión del servidor en Next.js.
// La validación de permisos debe hacerse en el backend de Laravel.
// TODO: Eliminar este archivo y las llamadas a can() en Server Actions,
// o implementar validación de permisos en Laravel API.

export default async function can(permiso: string) {
  // Temporalmente retorna true para no bloquear funcionalidad
  // La validación real debe hacerse en Laravel
  console.warn('⚠️ can() está deshabilitado - validar permisos en Laravel')
  return true
}
