import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

type ServerAction<TParams, TResult> = (params: TParams) => Promise<TResult>

// Overload sin `select`
export function useServerQuery<TParams, TResult>(props: {
  action: ServerAction<TParams, TResult>
  propsQuery?: Omit<
    UseQueryOptions<TResult, unknown, TResult, QueryKeys[]>,
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
    UseQueryOptions<TResult, unknown, TSelect, QueryKeys[]>,
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
    UseQueryOptions<TResult, unknown, TSelect, QueryKeys[]>,
    'queryFn'
  >
}) {
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

  return {
    refetch: query.refetch,
    loading: query.isPending,
    response: query.data,
    error: query.error,
  }
}
