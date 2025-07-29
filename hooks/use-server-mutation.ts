import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { App } from 'antd'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ServerResult } from '~/auth/middleware-server-actions'

export type ServerAction<TParams, TResult> = (
  params: TParams
) => Promise<ServerResult<TResult>>

export interface UseMutationActionProps<TParams, TResult> {
  action: ServerAction<TParams, TResult>
  onSuccess?: (res: ServerResult<TResult>) => void
  queryKey?: QueryKeys[]
  propsMutation?: Omit<
    UseMutationOptions<ServerResult<TResult>, unknown, TParams>,
    'mutationFn' | 'onSuccess'
  >
  msgSuccess?: string
}

export function useServerMutation<TParams, TResult>({
  action,
  queryKey,
  onSuccess,
  propsMutation,
  msgSuccess,
}: UseMutationActionProps<TParams, TResult>) {
  const queryClient = useQueryClient()
  const { notification } = App.useApp()

  const mutation = useMutation({
    mutationFn: action,
    onSuccess: res => {
      if (res?.error) {
        console.warn('🚨 Error:', res.error)
        notification.error({
          placement: 'bottomRight',
          message: 'Error',
          description: res.error.message,
        })
        return
      }
      if (queryKey) queryClient.invalidateQueries({ queryKey })
      if (msgSuccess)
        notification.success({
          placement: 'bottomRight',
          message: 'Operación exitosa',
          description: msgSuccess,
        })
      onSuccess?.(res)
    },
    ...propsMutation,
  })

  return {
    execute: mutation.mutateAsync,
    loading: mutation.isPending,
    response: mutation.data?.data,
    error: mutation.error,
  }
}
