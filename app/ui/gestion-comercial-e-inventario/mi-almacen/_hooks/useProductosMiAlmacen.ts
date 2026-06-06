'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productosApiV2 } from '~/lib/api';
import type { Producto, GetProductosParams } from '~/app/_types/producto';

interface UseProductosMiAlmacenParams {
  almacenId: number | null;
  filtros: Partial<GetProductosParams>;
  enabled?: boolean;
}

/**
 * Hook para la vista "Mi Almacén".
 *
 * Carga TODOS los productos de un almacén de una sola vez
 * y aplica filtros en memoria (client-side).
 *
 * Reemplaza useProductosInfiniteScroll.
 * El backend cachea el JSON completo por 10 minutos.
 */
export function useProductosMiAlmacen({
  almacenId,
  filtros,
  enabled = true,
}: UseProductosMiAlmacenParams) {
  const query = useQuery<Producto[]>({
    queryKey: ['productos-listado-completo', almacenId],
    queryFn: async () => {
      if (!almacenId) return [];
      const response = await productosApiV2.getListadoCompletoPorAlmacen(almacenId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!.data;
    },
    enabled: enabled && !!almacenId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10,   // 10 minutos
    refetchOnWindowFocus: false,
  });

  // Aplicar filtros del store en memoria (client-side filtering)
  const productosFiltrados = useMemo(() => {
    if (!query.data) return [];

    let result = query.data;

    // Filtro: estado (0 = inactivo, 1 = activo)
    if (filtros.estado !== undefined && filtros.estado !== null) {
      const estadoBool = filtros.estado === 1;
      result = result.filter((p) => p.estado === estadoBool);
    }

    // Filtro: marca_id
    if (filtros.marca_id) {
      result = result.filter((p) => p.marca_id === filtros.marca_id);
    }

    // Filtro: categoria_id
    if (filtros.categoria_id) {
      result = result.filter((p) => p.categoria_id === filtros.categoria_id);
    }

    // Filtro: unidad_medida_id
    if (filtros.unidad_medida_id) {
      result = result.filter((p) => p.unidad_medida_id === filtros.unidad_medida_id);
    }

    // Filtro: accion_tecnica (búsqueda parcial, case-insensitive)
    if (filtros.accion_tecnica) {
      const term = filtros.accion_tecnica.toLowerCase();
      result = result.filter((p) =>
        p.accion_tecnica?.toLowerCase().includes(term)
      );
    }

    // Filtro: ubicacion_id (busca en producto_en_almacenes del almacén actual)
    if (filtros.ubicacion_id && almacenId) {
      result = result.filter((p) => {
        const pa = p.producto_en_almacenes.find(
          (pa) => pa.almacen_id === almacenId
        );
        return pa?.ubicacion_id === filtros.ubicacion_id;
      });
    }

    // Filtro: cs_stock (con_stock | sin_stock | all)
    if (filtros.cs_stock && filtros.cs_stock !== 'all' && almacenId) {
      result = result.filter((p) => {
        const pa = p.producto_en_almacenes.find(
          (pa) => pa.almacen_id === almacenId
        );
        const stock = pa?.stock_fraccion ?? 0;
        if (filtros.cs_stock === 'con_stock') return stock > 0;
        if (filtros.cs_stock === 'sin_stock') return stock <= 0;
        return true;
      });
    }

    // Filtro: cs_comision (con_comision | sin_comision | all)
    if (filtros.cs_comision && filtros.cs_comision !== 'all' && almacenId) {
      result = result.filter((p) => {
        const pa = p.producto_en_almacenes.find(
          (pa) => pa.almacen_id === almacenId
        );
        const uds = pa?.unidades_derivadas ?? [];
        const tieneComision = uds.some(
          (ud) =>
            (ud.comision_publico ?? 0) > 0 ||
            (ud.comision_especial ?? 0) > 0 ||
            (ud.comision_minimo ?? 0) > 0 ||
            (ud.comision_ultimo ?? 0) > 0
        );
        if (filtros.cs_comision === 'con_comision') return tieneComision;
        if (filtros.cs_comision === 'sin_comision') return !tieneComision;
        return true;
      });
    }

    // Filtro: search (name, cod_producto, cod_barra, name_ticket)
    if (filtros.search) {
      const term = filtros.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.cod_producto.toLowerCase().includes(term) ||
          p.cod_barra?.toLowerCase().includes(term) ||
          p.name_ticket?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [query.data, filtros, almacenId]);

  return {
    data: productosFiltrados,
    allData: query.data ?? [],
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
