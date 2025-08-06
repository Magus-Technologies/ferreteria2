import type { Session } from 'next-auth'
import { auth } from './auth'

export type ServerResult<T> = {
  data?: T
  error?: { message: string }
}

export function withAuth<TParams, TData>(
  action: (params: TParams, session: Session) => Promise<ServerResult<TData>>
): (params: TParams) => Promise<ServerResult<TData>> {
  return async (params: TParams) => {
    const session = await auth()

    if (!session) {
      return {
        error: {
          message: 'Unauthorized',
        },
      }
    }

    return action(params, session)
  }
}
