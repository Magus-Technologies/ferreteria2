'use server'

import { auth } from '~/auth/auth'

export default async function can(permiso: string) {
  const session = await auth()
  return session?.user?.all_permissions.includes(permiso)
}
