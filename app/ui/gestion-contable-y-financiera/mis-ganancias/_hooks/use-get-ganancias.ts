'use client'

import { useQuery } from '@tanstack/react-query'
import { gananciasApi, type FiltrosGanancias } from '~/lib/api/ganancias'

export function useGetGanancias(filtros?: FiltrosGanancias) {
  return useQuery({
    queryKey: ['ganancias', filtros],
    queryFn: () => gananciasApi.getGanancias(filtros),
    enabled: !!filtros?.almacen_id, // Solo ejecutar si hay almacén
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

export function useGetResumenGanancias(filtros?: Omit<FiltrosGanancias, 'per_page' | 'page'>) {
  return useQuery({
    queryKey: ['ganancias-resumen', filtros],
    queryFn: () => gananciasApi.getResumen(filtros),
    enabled: !!filtros?.almacen_id, // Solo ejecutar si hay almacén
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  })
}