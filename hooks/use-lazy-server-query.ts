import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ServerAction } from './use-server-mutation'
import { ServerResult } from '~/auth/middleware-server-actions'
import { useEffect, useMemo, useState } from 'react'
import { App } from 'antd'

// Hook para queries que solo se ejecutan cuando son necesarias (lazy loading)
export function useLazyServerQuery<TParams, TResult>(props: {
  action: ServerAction<TParams, TResult>
  propsQuery?: Omit<
    UseQueryOptions<
      ServerResult<TResult>,
      unknown,
      ServerResult<TResult>,
      QueryKeys[]
    >,
    'queryFn' | 'enabled'
  >
  params: TParams
}) {
  const { notification } = App.useApp()
  const { action, params, propsQuery } = props
  const [shouldFetch, setShouldFetch] = useState(false)

  const {
    refetchOnWindowFocus = false,
    staleTime = 15 * 60 * 1000, // 15 minutos para lazy queries 
    gcTime = 30 * 60 * 1000,    // 30 minutos
    queryKey,
    ...restPropsQuery
  } = propsQuery || {}

  // Memoizar la función de query para evitar recreaciones innecesarias
  const queryFn = useMemo(
    () => () => action(params),
    [action, params]
  )

  const query = useQuery({
    queryFn,
    enabled: shouldFetch,
    refetchOnWindowFocus,
    staleTime,
    gcTime,
    queryKey: queryKey!,
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

  // Función para iniciar el fetch manualmente
  const triggerFetch = () => {
    setShouldFetch(true)
  }

  // Memoizar el objeto de retorno para evitar recreaciones
  return useMemo(() => ({
    refetch: query.refetch,
    loading: shouldFetch && (query.isPending || query.isFetching),
    response: query.data?.data,
    error: query.error,
    isPending: query.isPending,
    isFetching: query.isFetching,
    triggerFetch,
    isFetched: shouldFetch,
  }), [
    query.refetch,
    query.isPending,
    query.isFetching,
    query.data?.data,
    query.error,
    shouldFetch,
  ])
}