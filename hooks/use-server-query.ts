import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ServerAction } from './use-server-mutation'
import { ServerResult } from '~/auth/middleware-server-actions'
import { useEffect } from 'react'
import { App } from 'antd'

// Overload sin `select`
export function useServerQuery<TParams, TResult>(props: {
  action: ServerAction<TParams, TResult>
  propsQuery?: Omit<
    UseQueryOptions<
      ServerResult<TResult>,
      unknown,
      ServerResult<TResult>,
      QueryKeys[]
    >,
    'queryFn'
  >
  params: TParams
}): {
  refetch: () => void
  loading: boolean
  response: TResult | undefined
  error: unknown
}

// Overload con `select`
export function useServerQuery<TParams, TResult, TSelect>(props: {
  action: ServerAction<TParams, TResult>
  propsQuery?: Omit<
    UseQueryOptions<
      ServerResult<TResult>,
      unknown,
      ServerResult<TSelect>,
      QueryKeys[]
    >,
    'queryFn'
  >
  params: TParams
}): {
  refetch: () => void
  loading: boolean
  response: TSelect | undefined
  error: unknown
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
      QueryKeys[]
    >,
    'queryFn'
  >
}) {
  const { notification } = App.useApp()
  const { action, params, propsQuery } = props

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    queryKey,
    ...restPropsQuery
  } = propsQuery || {}

  const query = useQuery({
    queryFn: () => action(params),
    enabled,
    refetchOnWindowFocus,
    queryKey: queryKey!,
    ...restPropsQuery,
  })

  useEffect(() => {
    if (query.data?.error) {
      console.warn('🚨 Error:', query.data?.error)
      notification.error({
        message: 'Error',
        description: query.data.error.message,
      })
    }
  }, [notification, query.data])

  return {
    refetch: query.refetch,
    loading: query.isPending,
    response: query.data?.data,
    error: query.error,
  }
}
