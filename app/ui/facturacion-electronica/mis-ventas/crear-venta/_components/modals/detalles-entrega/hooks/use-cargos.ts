import { useQuery } from '@tanstack/react-query'
import { useAuth } from '~/lib/auth-context'
import { cargosHierarchyApi, type CargoHierarchy } from '~/lib/api/cargos-hierarchy'

export interface Cargo {
  codigo: string
  descripcion: string
}

/**
 * Catálogo de cargos para el selector de "pedido externo".
 * Muestra SOLO el cargo PADRE del usuario actual (un nivel arriba en la jerarquía).
 * 
 * Ejemplo:
 * - Usuario con cargo "AYUDANTE DE CAMION" (parent: "CONDUCTOR MOTO-OBRERO")
 *   → Muestra: CONDUCTOR MOTO-OBRERO
 * - Usuario con cargo "CONDUCTOR MOTO-OBRERO" (parent: "GERENTE GENERAL GERENCIA")
 *   → Muestra: GERENTE GENERAL GERENCIA
 * - Usuario con cargo "GERENTE GENERAL GERENCIA" (parent: null)
 *   → Muestra: todos los cargos (sin filtro parent)
 */
export function useCargos() {
  const { user } = useAuth()
  const userCargo = user?.cargo || null

  return useQuery({
    queryKey: ['catalogos', 'cargos', userCargo],
    queryFn: async () => {
      // Primero obtener todos los cargos para encontrar el padre del usuario
      const allCargosResult = await cargosHierarchyApi.getAllCargos()
      const allCargos = allCargosResult.data?.data || []

      // Encontrar el cargo del usuario para obtener su parent
      const userCargoObj = allCargos.find((c) => c.codigo === userCargo)
      const userParent = userCargoObj?.parent || null

      // Si el usuario no tiene padre (es root), mostrar todos los cargos
      if (!userParent) {
        return allCargos.map((c) => ({
          codigo: c.codigo,
          descripcion: c.descripcion,
        }))
      }

      // Si el usuario tiene padre, obtener SOLO el cargo padre (no los hermanos)
      const parentCargoObj = allCargos.find((c) => c.codigo === userParent)
      
      if (parentCargoObj) {
        return [{
          codigo: parentCargoObj.codigo,
          descripcion: parentCargoObj.descripcion,
        }]
      }

      return []
    },
  })
}
