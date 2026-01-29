import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/db/db'
import { generarPDFVenta } from '~/lib/pdf/generar-pdf-venta'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ventaId } = await params

    // Obtener la venta con todos sus datos
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
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
        user: {
          include: {
            empresa: true,
          },
        },
        cliente: true,
        almacen: true,
      },
    })

    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Generar el PDF
    const pdfBuffer = await generarPDFVenta(venta)

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${venta.tipo_documento}-${venta.serie}-${venta.numero}.pdf"`,
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
