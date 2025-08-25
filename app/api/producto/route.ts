import { NextRequest, NextResponse } from 'next/server'
import { auth } from '~/auth/auth'
import fs from 'fs'
import path from 'path'
import { Producto } from '@prisma/client'
import { prisma } from '~/db/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()

  const img_file = formData.get('img_file') as File | undefined
  const img_prev = formData.get('img_prev') as string | undefined

  const ficha_tecnica_file = formData.get('ficha_tecnica_file') as
    | File
    | undefined
  const ficha_tecnica_prev = formData.get('ficha_tecnica_prev') as
    | string
    | undefined

  const cod_producto = formData.get('cod_producto') as string

  const dataProductFormated: Pick<Producto, 'img' | 'ficha_tecnica'> = {
    img: null,
    ficha_tecnica: null,
  }

  try {
    const path_img = await replaceFile({
      url: img_prev,
      file: img_file,
      ruta: '/uploads/productos/imgs',
      fileName: cod_producto,
    })
    dataProductFormated.img = path_img

    const path_ficha_tecnica = await replaceFile({
      url: ficha_tecnica_prev,
      file: ficha_tecnica_file,
      ruta: '/uploads/productos/fichas-tecnicas',
      fileName: cod_producto,
    })
    dataProductFormated.ficha_tecnica = path_ficha_tecnica

    await prisma.producto.update({
      where: {
        cod_producto,
      },
      data: dataProductFormated,
    })

    return NextResponse.json({ data: 'ok' })
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 })
  }
}

async function replaceFile({
  url,
  file,
  ruta,
  fileName,
}: {
  url?: string
  file?: File
  ruta: string
  fileName: string
}) {
  await fs.promises.mkdir(`public${ruta}`, {
    recursive: true,
  })
  const UPLOAD_DIR = path.join(process.cwd(), `public${ruta}`)

  if (url) {
    const filePath = path.join(process.cwd(), 'public', url)
    try {
      await fs.promises.unlink(filePath)
    } catch (err) {
      if (
        !(
          err instanceof Error &&
          (err as NodeJS.ErrnoException).code === 'ENOENT'
        )
      )
        throw err
    }
  }

  if (!file) return null

  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = file.type
  const ext = mime.split('/')[1]
  const newFilePath = path.join(UPLOAD_DIR, `${fileName}.${ext}`)
  await fs.promises.writeFile(newFilePath, buffer)

  return `${ruta}/${fileName}.${ext}`
}
