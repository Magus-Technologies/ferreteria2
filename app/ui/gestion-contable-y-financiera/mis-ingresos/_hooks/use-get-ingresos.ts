import { useQuery } from '@tanstack/react-query'
import { getIngresosExtras, getResumenIngresosExtras } from '~/lib/api/ingreso-extra'

export const useGetIngresos = (
  filtros: any,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['ingresos-extras', filtros],
    queryFn: () => getIngresosExtras(),
    enabled: enabled && !!filtros,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useGetResumenIngresos = (
  filtros: any,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['ingresos-extras-resumen', filtros],
    queryFn: () => getResumenIngresosExtras(),
    enabled: enabled && !!filtros,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}
