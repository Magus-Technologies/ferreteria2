import { useState, useCallback } from 'react'

type ServerAction<TParams, TResult> = (params: TParams) => Promise<TResult>

interface UseServerActionProps<TParams, TResult> {
  action: ServerAction<TParams, TResult>
  onSuccess?: (res: TResult) => void
  onError?: (error: unknown) => void
}

export function useServerAction<TParams, TResult>({
  action,
  onSuccess,
  onError,
}: UseServerActionProps<TParams, TResult>) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<TResult | null>(null)
  const [error, setError] = useState<unknown>(null)

  const execute = useCallback(
    async (params: TParams) => {
      setLoading(true)
      setError(null)
      try {
        const res = await action(params)
        setResponse(res)
        onSuccess?.(res)
        return res
      } catch (err) {
        setError(err)
        onError?.(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [action, onError, onSuccess]
  )

  return {
    execute,
    loading,
    response,
    error,
  }
}
