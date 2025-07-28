import type { Session } from 'next-auth'
import { auth } from './auth'

export function withAuth<TParams, TResult>(
  action: (params: TParams, session: Session) => Promise<TResult>
) {
  return async (params: TParams): Promise<TResult> => {
    const session = (await auth()) as Session | null
    if (!session) {
      throw new Error('Unauthorized')
    }

    return action(params, session)
  }
}
