import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ServerAction } from './use-server-mutation'
import { ServerResult } from '~/auth/middleware-server-actions'
import { useEffect, useMemo, useState } from 'react'
import { App } from 'antd'

interface PaginationParams {
  skip?: number
  take?: number
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
}

/**
 * Hook optimizado con paginación real para manejar grandes cantidades de datos
 */
export function usePaginatedServerQuery<TParams extends PaginationParams, TResult>(props: {
  action: ServerAction<TParams, PaginatedResult<TResult>>
  propsQuery?: Omit<
    UseQueryOptions<
      ServerResult<PaginatedResult<TResult>>,
      unknown,
      ServerResult<PaginatedResult<TResult>>,
      QueryKeys[]
    >,
    'queryFn'
  >
  params: TParams
  pageSize?: number
  enabled?: boolean
}) {
  const { notification } = App.useApp()
  const { action, params, propsQuery, pageSize = 50, enabled = true } = props
  const [currentPage, setCurrentPage] = useState(0)
  
  const paginatedParams = useMemo(() => ({
    ...params,
    skip: currentPage * pageSize,
    take: pageSize,
  }), [params, currentPage, pageSize])

  const {
    refetchOnWindowFocus = false,
    staleTime = 3 * 60 * 1000, // 3 minutos para datos paginados
    gcTime = 10 * 60 * 1000,
    queryKey,
    ...restPropsQuery
  } = propsQuery || {}

  const queryFn = useMemo(
    () => () => action(paginatedParams),
    [action, paginatedParams]
  )

  // Construir un queryKey único que incluya los parámetros
  const fullQueryKey = useMemo(() => {
    const baseKey = queryKey || []
    // Agregar los parámetros al queryKey para que sea único
    return [...baseKey, { params: paginatedParams }]
  }, [queryKey, paginatedParams])

  const query = useQuery({
    queryFn,
    enabled,
    refetchOnWindowFocus,
    staleTime,
    gcTime,
    queryKey: fullQueryKey,
    meta: { page: currentPage },
    ...restPropsQuery,
  })

  useEffect(() => {
    if (query.data?.error) {
      console.warn('🚨 Error:', query.data?.error)
      notification.error({
        message: 'Error',
        description: query.data.error.message,
        duration: 3,
      })
    }
  }, [notification, query.data])

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const nextPage = () => {
    if (query.data?.data?.hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Mantener los datos anteriores mientras se hace refetch
  const [cachedData, setCachedData] = useState<TResult[]>([])
  
  useEffect(() => {
    if (query.data?.data?.data) {
      setCachedData(query.data.data.data)
    }
  }, [query.data])

  // Si estamos haciendo refetch y no hay datos nuevos, mostrar los datos en caché
  const displayData = query.data?.data?.data ?? (query.isFetching ? cachedData : [])

  return {
    refetch: query.refetch,
    loading: query.isPending,
    response: displayData,
    total: query.data?.data?.total || 0,
    hasMore: query.data?.data?.hasMore || false,
    error: query.error,
    currentPage,
    pageSize,
    totalPages: Math.ceil((query.data?.data?.total || 0) / pageSize),
    goToPage,
    nextPage,
    prevPage,
    isPending: query.isPending,
    isFetching: query.isFetching,
  }
}