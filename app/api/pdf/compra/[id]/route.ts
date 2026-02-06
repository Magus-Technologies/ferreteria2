import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/db/db'
import { generarPDFCompra } from '~/lib/pdf/generar-pdf-compra'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: compraId } = await params

    // Obtener la compra con todos sus datos
    const compra = await prisma.compra.findUnique({
      where: { id: compraId },
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
        proveedor: true,
        almacen: true,
        pagos_de_compras: true,
      },
    })

    if (!compra) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 }
      )
    }

    // Generar el PDF
    const pdfBuffer = await generarPDFCompra(compra)

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Compra-${compra.serie}-${compra.numero}.pdf"`,
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
