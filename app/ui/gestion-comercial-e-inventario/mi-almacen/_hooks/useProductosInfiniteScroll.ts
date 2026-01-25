'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { productosApiV2 } from '~/lib/api';
import type { GetProductosParams } from '~/app/_types/producto';
import { useMemo } from 'react';

interface UseProductosInfiniteScrollParams {
  filtros: Omit<GetProductosParams, 'page' | 'per_page'>;
  enabled?: boolean;
  perPage?: number;
}

/**
 * Hook optimizado para carga infinita de productos
 * 
 * Estrategia:
 * 1. Carga inicial de 200 productos (rápido)
 * 2. Carga automática de más páginas en segundo plano
 * 3. Cache inteligente para filtros rápidos
 * 4. Compatible con AG Grid Server-Side Row Model
 */
export function useProductosInfiniteScroll({
  filtros,
  enabled = true,
  perPage = 200, // Tamaño de página optimizado
}: UseProductosInfiniteScrollParams) {
  const query = useInfiniteQuery({
    queryKey: ['productos-infinite', filtros, perPage],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      console.log(`🔄 Cargando página ${pageParam} de productos...`);
      
      const response = await productosApiV2.getAllByAlmacen({
        ...filtros,
        page: pageParam,
        per_page: perPage,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log(`✅ Página ${pageParam} cargada: ${response.data!.data.length} productos`);
      
      return response.data!;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Si hay más páginas, retornar el número de la siguiente
      if (lastPage.current_page < lastPage.last_page) {
        return lastPage.current_page + 1;
      }
      return undefined; // No hay más páginas
    },
    enabled: enabled && !!filtros.almacen_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
    refetchOnWindowFocus: false, // No recargar al volver a la ventana
  });

  // Combinar todos los productos de todas las páginas
  const allProducts = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap(page => page.data);
  }, [query.data]);

  // Información de paginación
  const paginationInfo = useMemo(() => {
    const firstPage = query.data?.pages[0];
    const lastPage = query.data?.pages[query.data.pages.length - 1];
    
    return {
      total: firstPage?.total ?? 0,
      loaded: allProducts.length,
      currentPage: lastPage?.current_page ?? 1,
      totalPages: firstPage?.last_page ?? 1,
      perPage: firstPage?.per_page ?? perPage,
      hasMore: (lastPage?.current_page ?? 0) < (firstPage?.last_page ?? 0),
    };
  }, [query.data, allProducts.length, perPage]);

  return {
    // Datos
    data: allProducts,
    
    // Estado de carga
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error,
    
    // Información de paginación
    ...paginationInfo,
    
    // Acciones
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    
    // Estado de la query
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
  };
}
