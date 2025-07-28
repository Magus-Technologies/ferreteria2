'use server'

export async function createMarca({ name }: { name: string }) {
  console.log('🚀 ~ file: marca.ts:4 ~ name:', name)
  if (typeof window !== 'undefined')
    console.warn('🚨 Este log está en el cliente')
  const item = await new Promise<string>(resolve =>
    setTimeout(() => resolve(name), 3000)
  )
  return item
}
