'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { Marca } from '../_types/producto'

async function getMarcasWA() {
  return { error: { message: 'Error al obtener marcas' } }
  const items = await new Promise<Marca[]>(resolve =>
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
  return { data: items }
}
export const getMarcas = withAuth(getMarcasWA)

async function createMarcaWA({ name }: { name: string }) {
  try {
    const item = await new Promise<string>(resolve =>
      setTimeout(() => resolve(name), 3000)
    )
    return { data: item }
  } catch (error) {
    return {
      error: {
        message: JSON.stringify(error, null, 2),
        data: error,
      },
    }
  }
}
export const createMarca = withAuth(createMarcaWA)
