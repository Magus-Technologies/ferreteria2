import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ServerAction } from './use-server-mutation'
import { ServerResult } from '~/auth/middleware-server-actions'
import { useEffect, useMemo } from 'react'
import { App } from 'antd'

// Overload sin `select`
export function useServerQuery<TParams, TResult>(props: {
  action: ServerAction<TParams, TResult>
  propsQuery?: Omit<
    UseQueryOptions<
      ServerResult<TResult>,
      unknown,
      ServerResult<TResult>,
      (QueryKeys | string | number)[]
    >,
    'queryFn'
  >
  params: TParams
}): {
  refetch: () => void
  loading: boolean
  response: TResult | undefined
  error: unknown
  isPending: boolean
  isFetching: boolean
}

// Overload con `select`
export function useServerQuery<TParams, TResult, TSelect>(props: {
  action: ServerAction<TParams, TResult>
  propsQuery?: Omit<
    UseQueryOptions<
      ServerResult<TResult>,
      unknown,
      ServerResult<TSelect>,
      (QueryKeys | string | number)[]
    >,
    'queryFn'
  >
  params: TParams
}): {
  refetch: () => void
  loading: boolean
  response: TSelect | undefined
  error: unknown
  isPending: boolean
  isFetching: boolean
}

// Implementación
export function useServerQuery<TParams, TResult, TSelect>(props: {
  action: ServerAction<TParams, TResult>
  params: TParams
  propsQuery?: Omit<
    UseQueryOptions<
      ServerResult<TResult>,
      unknown,
      ServerResult<TSelect>,
      (QueryKeys | string | number)[]
    >,
    'queryFn'
  >
}) {
  const { notification } = App.useApp()
  const { action, params, propsQuery } = props

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutos
    gcTime = 10 * 60 * 1000,   // 10 minutos  
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
    enabled,
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
        duration: 3, // Reducir duración de notificaciones
      })
    }
  }, [notification, query.data])

  // Memoizar el objeto de retorno para evitar recreaciones
  return useMemo(() => ({
    refetch: query.refetch,
    loading:
      propsQuery?.enabled === false
        ? false
        : query.isPending || query.isFetching,
    response: query.data?.data,
    error: query.error,
    isPending: query.isPending,
    isFetching: query.isFetching,
  }), [
    query.refetch,
    propsQuery?.enabled,
    query.isPending,
    query.isFetching,
    query.data?.data,
    query.error,
  ])
}
