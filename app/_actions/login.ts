'use server'

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
