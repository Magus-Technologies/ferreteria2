'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { Marca } from '../_types/producto'

async function getMarcasWA() {
  const item = await new Promise<Marca[]>(resolve =>
    setTimeout(() => {
      const random = Math.floor(Math.random() * 10) + 1
      resolve([
        {
          id: random,
          name: 'Marca ' + random,
        },
        {
          id: random + 1,
          name: 'Marca ' + (random + 1),
        },
      ])
    }, 3000)
  )
  return item
}
export const getMarcas = withAuth(getMarcasWA)

async function createMarcaWA({ name }: { name: string }) {
  const item = await new Promise<string>(resolve =>
    setTimeout(() => resolve(name), 3000)
  )
  return item
}
export const createMarca = withAuth(createMarcaWA)
