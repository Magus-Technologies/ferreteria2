import { NextRequest, NextResponse } from 'next/server'
import { auth } from '~/auth/auth'
import { prisma } from '~/db/db'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as unknown as File[]
    const tipo = formData.get('tipo') as 'img' | 'ficha_tecnica'
    if (!tipo) throw new Error('Tipo no proporcionado')

    let ruta = '/uploads/productos/imgs'
    if (tipo === 'ficha_tecnica') ruta = '/uploads/productos/fichas-tecnicas'

    const fileNames = [...files].map(file => {
      const name = file.name.split('.')
      name.pop()
      return name.join('.')
    })

    const productos = await prisma.producto.findMany({
      where: {
        cod_producto: {
          in: fileNames,
        },
      },
      select: {
        cod_producto: true,
        img: true,
        ficha_tecnica: true,
      },
    })

    const productosFound = fileNames.filter(fileName =>
      productos.some(producto => producto.cod_producto === fileName)
    )
    const filesFound = [...files].filter(file => {
      const name = file.name.split('.')
      name.pop()
      return productos.some(
        producto => producto.cod_producto === name.join('.')
      )
    })

    await replaceFiles({
      urls: productos
        .filter(producto => productosFound.includes(producto.cod_producto))
        .map(producto => producto[tipo])
        .filter(url => url !== null),
      files: filesFound,
      ruta,
      tipo,
    })

    const productosNotFound = fileNames.filter(
      fileName =>
        !productos.some(producto => producto.cod_producto === fileName)
    )
    return NextResponse.json({ data: productosNotFound })
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 })
  }
}

async function replaceFiles({
  urls,
  files,
  ruta,
  tipo,
}: {
  urls: string[]
  files: File[]
  ruta: string
  tipo: 'img' | 'ficha_tecnica'
}) {
  await fs.promises.mkdir(`public${ruta}`, {
    recursive: true,
  })
  const UPLOAD_DIR = path.join(process.cwd(), `public${ruta}`)

  for (const url of urls) {
    const filePath = path.join(process.cwd(), 'public', url)
    try {
      await fs.promises.unlink(filePath)
    } catch (err) {
      if (
        err instanceof Error &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        // ignorar si el archivo no existe
        continue
      }
      throw err
    }
  }

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const newFilePath = path.join(UPLOAD_DIR, file.name)
    await fs.promises.writeFile(newFilePath, buffer)
    const cod_producto = file.name.split('.')
    cod_producto.pop()
    await prisma.producto.update({
      where: {
        cod_producto: cod_producto.join('.'),
      },
      data: {
        [tipo]: `${ruta}/${file.name}`,
      },
    })
  }
}
