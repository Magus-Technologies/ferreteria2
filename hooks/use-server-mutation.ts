import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { App } from 'antd'
import { QueryKeys } from '~/app/_lib/queryKeys'

// Tipo para el resultado de Server Actions
export type ServerResult<T> = {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

export type ServerAction<TParams, TResult> = (
  params: TParams
) => Promise<ServerResult<TResult>>

export interface UseMutationActionProps<TParams, TResult> {
  action: ServerAction<TParams, TResult>
  onSuccess?: (res: ServerResult<TResult>) => void
  queryKey?: QueryKeys[]
  propsMutation?: Omit<
    UseMutationOptions<ServerResult<TResult>, unknown, TParams>,
    'mutationFn' | 'onSuccess' | 'onError'
  >
  msgSuccess?: string
  showNotificationError?: boolean
  onErrorControled?: (error: ServerResult<TResult>['error']) => void
}

export function useServerMutation<TParams, TResult>({
  action,
  queryKey,
  onSuccess,
  propsMutation,
  msgSuccess,
  showNotificationError = true,
  onErrorControled,
}: UseMutationActionProps<TParams, TResult>) {
  const queryClient = useQueryClient()
  const { notification } = App.useApp()

  const mutation = useMutation({
    mutationFn: action,
    onSuccess: res => {
      if (res?.error) {
        console.warn('🚨 Error:', res.error)
        if (showNotificationError)
          notification.error({
            message: 'Error',
            description: res.error.message,
          })
        onErrorControled?.(res.error)
        return
      }
      if (queryKey)
        queryKey.forEach(key =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      if (msgSuccess)
        notification.success({
          message: 'Operación exitosa',
          description: msgSuccess,
        })
      onSuccess?.(res)
    },
    onError: (error: unknown) => {
      if (showNotificationError) {
        const message =
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado'
        notification.error({
          message: 'Error',
          description: message,
        })
      }
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
