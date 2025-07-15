import { useState, useTransition } from 'react'

export default function useServerAction<TData, TRes extends { error?: string }>(
  action: (data: TData) => Promise<TRes>
) {
  const [isPending, startTransition] = useTransition()
  const [res, setRes] = useState<TRes | null>(null)

  function handleAction(data: TData) {
    startTransition(async () => {
      const result = await action(data)
      setRes(result)
      console.log('🚀 ~ file: use-server-action.ts:8 ~ result:', result)

      if (result.error) {
        console.log(result.error)
      }
    })
  }

  return {
    isPending,
    res,
    handleAction,
  }
}
