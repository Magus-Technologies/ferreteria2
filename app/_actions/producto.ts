'use server'

export async function getProductos(data: { ubicacion: string }) {
  const { ubicacion } = data
  const producto = await new Promise<string>(resolve =>
    setTimeout(() => resolve(ubicacion), 3000)
  )
  return producto
}
