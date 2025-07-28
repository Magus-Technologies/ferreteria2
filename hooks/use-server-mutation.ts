import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

type ServerAction<TParams, TResult> = (params: TParams) => Promise<TResult>

export interface UseMutationActionProps<TParams, TResult> {
  action: ServerAction<TParams, TResult>
  onSuccess?: (res: TResult) => void
  queryKey?: QueryKeys[]
  propsMutation?: Omit<
    UseMutationOptions<TResult, unknown, TParams>,
    'mutationFn' | 'onSuccess'
  >
}

export function useServerMutation<TParams, TResult>({
  action,
  queryKey,
  onSuccess,
  propsMutation,
}: UseMutationActionProps<TParams, TResult>) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: action,
    onSuccess: res => {
      if (queryKey) queryClient.invalidateQueries({ queryKey })
      onSuccess?.(res)
    },
    ...propsMutation,
  })

  return {
    execute: mutation.mutateAsync,
    loading: mutation.isPending,
    response: mutation.data,
    error: mutation.error,
  }
}
