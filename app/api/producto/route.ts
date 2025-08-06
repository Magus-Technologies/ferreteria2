import { NextRequest, NextResponse } from 'next/server'
import { auth } from '~/auth/auth'
import fs from 'fs'
import { Producto } from '@prisma/client'
import { prisma } from '~/db/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const img_file = formData.get('img_file') as File | null
  const ficha_tecnica_file = formData.get('ficha_tecnica_file') as File | null
  const cod_producto = formData.get('cod_producto') as string

  const dataProductFormated: Pick<Producto, 'img' | 'ficha_tecnica'> = {
    img: null,
    ficha_tecnica: null,
  }

  if (img_file) {
    const data = await img_file.arrayBuffer()
    const mime = img_file.type
    const ext = mime.split('/')[1]
    const path = `/uploads/productos/imgs/${cod_producto}.${ext}`
    await fs.promises.mkdir(`public/uploads/productos/imgs`, {
      recursive: true,
    })
    fs.promises.writeFile(`public${path}`, Buffer.from(data))
    dataProductFormated.img = path
  }

  if (ficha_tecnica_file) {
    const data = await ficha_tecnica_file.arrayBuffer()
    const mime = ficha_tecnica_file.type
    const ext = mime.split('/')[1]
    const path = `/uploads/productos/fichas-tecnicas/${cod_producto}.${ext}`
    await fs.promises.mkdir(`public/uploads/productos/fichas-tecnicas`, {
      recursive: true,
    })
    fs.promises.writeFile(`public${path}`, Buffer.from(data))
    dataProductFormated.ficha_tecnica = path
  }

  if (!img_file && !ficha_tecnica_file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  await prisma.producto.update({
    where: {
      cod_producto,
    },
    data: dataProductFormated,
  })

  return NextResponse.json({ data: 'ok' })
}
