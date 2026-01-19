import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/db/db'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  // Obtener el token de autenticación del header
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Aquí podrías validar el token contra Laravel si es necesario
  // Por ahora, si tiene token, asumimos que está autenticado

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as unknown as File[]
    const tipo = formData.get('tipo') as 'img' | 'ficha_tecnica'
    if (!tipo) throw new Error('Tipo no proporcionado')

    // Usar la misma estructura de rutas que Laravel Storage
    let ruta = 'productos/imgs'
    if (tipo === 'ficha_tecnica') ruta = 'productos/fichas-tecnicas'

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
  // Laravel Storage guarda en storage/app/public/
  // Necesitamos guardar en la carpeta de Laravel, no en Next.js
  const LARAVEL_STORAGE_DIR = path.join(
    process.cwd(),
    '..',
    'ferreteria-backend',
    'storage',
    'app',
    'public',
    ruta
  )
  
  // Crear directorio si no existe
  await fs.promises.mkdir(LARAVEL_STORAGE_DIR, {
    recursive: true,
  })

  // Eliminar archivos anteriores
  for (const url of urls) {
    // La URL puede venir como 'productos/imgs/file.jpg' o '/uploads/productos/imgs/file.jpg'
    let filePath: string
    if (url.startsWith('/uploads/')) {
      // Formato antiguo de Next.js - buscar en public de Next.js
      filePath = path.join(process.cwd(), 'public', url)
    } else {
      // Formato de Laravel Storage - buscar en storage de Laravel
      filePath = path.join(
        process.cwd(),
        '..',
        'ferreteria-backend',
        'storage',
        'app',
        'public',
        url
      )
    }
    
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

  // Guardar nuevos archivos
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const newFilePath = path.join(LARAVEL_STORAGE_DIR, file.name)
    await fs.promises.writeFile(newFilePath, buffer)
    
    const cod_producto = file.name.split('.')
    cod_producto.pop()
    
    // Guardar en DB con la misma estructura que Laravel: 'productos/imgs/file.jpg'
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
