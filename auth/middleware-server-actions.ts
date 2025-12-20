import type { Session } from 'next-auth'
// import { auth } from './auth' // Ya no se usa, ahora auth es con Laravel
import { errorFormated } from '~/utils/error-formated'

export type ServerResult<T> = {
  data?: T
  error?: { message: string; data?: unknown }
}

export function withAuth<TParams, TData>(
  action: (params: TParams, session: Session) => Promise<ServerResult<TData>>
): (params: TParams) => Promise<ServerResult<TData>> {
  return async (params: TParams) => {
    // TEMPORAL: Deshabilitamos NextAuth ya que ahora usamos Laravel Sanctum
    // const session = await auth()

    // TODO: Implementar validación con token de Laravel si es necesario
    // Por ahora, permitimos todas las peticiones ya que Laravel maneja la auth

    // if (!session) {
    //   return {
    //     error: {
    //       message: 'Unauthorized',
    //     },
    //   }
    // }

    // Crear una sesión dummy para mantener compatibilidad
    const session = {} as Session;

    try {
      return await action(params, session)
    } catch (error) {
      return errorFormated(error)
    }
  }
}
