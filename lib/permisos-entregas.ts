// Usuarios que se comportan como ADMIN en mis-entregas: ven el icono de
// configuración de roles y, al entrar, ven todos los estados sin filtro.
//
// Se resuelve por `role_name` (nombre real del rol) y no por `rol_sistema`,
// porque ese campo legacy quedó en null tras renombrar el rol
// "Administrador Global" → "Gerente General". Así, cualquier usuario nuevo
// que se cree con uno de estos roles lo ve automáticamente, sin tocar código.
const ROLES_ADMIN_ENTREGAS = [
  'gerente general',
  'administrador general',
]

const norm = (r?: string | null): string => (r ?? '').trim().toLowerCase()

export function esAdminEntregas(
  user?: { id?: string; role_name?: string | null; rol_sistema?: string | null } | null,
): boolean {
  if (!user) return false

  return (
    ROLES_ADMIN_ENTREGAS.includes(norm(user.role_name)) ||
    norm(user.rol_sistema) === 'administrador'
  )
}
