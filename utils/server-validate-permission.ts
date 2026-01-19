'use server'

import { auth } from '~/auth/auth'

export default async function can(permiso: string) {
  try {
    const session = await auth()
    return session?.user?.all_permissions?.includes(permiso)
  } catch (error) {
    console.error('Error en can():', error)
    return false
  }
}
