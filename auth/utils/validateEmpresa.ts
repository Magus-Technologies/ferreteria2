import { Session } from 'next-auth'

/**
 * Valida que la sesión tenga una empresa asignada
 * @throws Error si no hay empresa
 */
export function validateEmpresa(session: Session | null): asserts session is Session & {
  user: {
    empresa: NonNullable<Session['user']['empresa']>
  }
} {
  if (!session) {
    throw new Error('No hay sesión activa')
  }
  
  if (!session.user.empresa) {
    throw new Error('El usuario no tiene una empresa asignada. Por favor contacta al administrador.')
  }
}

/**
 * Obtiene la empresa de la sesión de forma segura
 * @returns La empresa o lanza un error
 */
export function getEmpresaFromSession(session: Session | null) {
  validateEmpresa(session)
  return session.user.empresa
}
