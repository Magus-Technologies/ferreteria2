import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/db/db'
import { generarPDFCotizacion } from '~/lib/pdf/generar-pdf-cotizacion'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacionId } = await params

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: {
        productos_por_almacen: {
          include: {
            producto_almacen: {
              include: {
                producto: {
                  include: {
                    marca: true,
                    unidad_medida: true,
                  },
                },
              },
            },
            unidades_derivadas: {
              include: {
                unidad_derivada_inmutable: true,
              },
            },
          },
        },
        user: true,
        cliente: true,
        almacen: true,
      },
    })

    if (!cotizacion) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    const pdfBuffer = await generarPDFCotizacion(cotizacion)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="COTIZACION-${cotizacion.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}
