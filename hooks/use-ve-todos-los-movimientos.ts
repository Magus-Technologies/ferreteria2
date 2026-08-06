'use client'

import { useMemo } from 'react'
import { useAuth } from '~/lib/auth-context'

/**
 * Roles que ven TODOS los movimientos/ventas de todos los usuarios por defecto.
 * Cualquier otro rol arranca con el filtro de usuario precargado con su propio
 * ID (ve solo lo suyo). Misma lista y lógica que
 * mis-ventas/_components/filters/filters-mis-ventas.tsx — reutilizada acá para
 * que "Movimientos de Caja" (Préstamos, Depósitos, Traslados a Bóveda,
 * Traslado de Efectivo) se comporte igual.
 */
const ROLES_VEN_TODOS_LOS_MOVIMIENTOS = [
  'ADMINISTRADOR',
  'ADMIN',
  'ADMIN GLOBAL',
  'ADMINISTRADOR GLOBAL',
  'GERENTE',
]

export function useVeTodosLosMovimientos() {
  const { user } = useAuth()

  const veTodo = useMemo(() => {
    const norm = (r?: string | null) => (r ?? '').trim().toUpperCase()
    return (
      ROLES_VEN_TODOS_LOS_MOVIMIENTOS.includes(norm(user?.role_name)) ||
      ROLES_VEN_TODOS_LOS_MOVIMIENTOS.includes(norm(user?.rol_sistema))
    )
  }, [user?.role_name, user?.rol_sistema])

  return { veTodo, userId: user?.id }
}
