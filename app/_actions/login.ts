'use server'

// NOTA: Esta función ya no se usa con Laravel API
// El login ahora se maneja directamente en el cliente con useAuth()
// Mantener por compatibilidad pero no se recomienda usar

import { signIn } from '~/auth/auth'
import { LoginValues } from '../page'

export default async function loginServer(values: LoginValues) {
  try {
    await signIn('credentials', { ...values, redirect: false })
    return { data: true }
  } catch {
    return { error: { message: 'Email o contraseña incorrectos' } }
  }
}
