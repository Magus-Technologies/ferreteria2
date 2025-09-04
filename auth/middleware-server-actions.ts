import type { Session } from 'next-auth'
import { auth } from './auth'
import { errorFormated } from '~/utils/error-formated'

export type ServerResult<T> = {
  data?: T
  error?: { message: string; data?: unknown }
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
    try {
      return await action(params, session)
    } catch (error) {
      return errorFormated(error)
    }
  }
}
