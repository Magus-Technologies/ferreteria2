'use client';

import { useQuery } from '@tanstack/react-query';
import { ordenCompraApi, type OrdenCompraFilters } from '~/lib/api/orden-compra';

export function useOrdenes(filters?: OrdenCompraFilters) {
  return useQuery({
    queryKey: ['ordenes-compra', filters],
    queryFn: () => ordenCompraApi.getAll(filters),
    enabled: !!filters?.almacen_id,
  });
}
