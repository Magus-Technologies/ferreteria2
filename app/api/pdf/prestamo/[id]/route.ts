import { NextRequest, NextResponse } from 'next/server'
import { generarPDFPrestamo } from '~/lib/pdf/generar-pdf-prestamo'
import { prestamoApi } from '~/lib/api/prestamo'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prestamoId } = await params

    // Obtener datos del préstamo desde Laravel API (sin autenticación)
    const response = await prestamoApi.getById(prestamoId);
    
    console.log('Respuesta de API préstamo:', JSON.stringify(response, null, 2));

    if (response.error || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    const prestamo = response.data.data;

    if (!prestamo) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    console.log('Usuario en préstamo:', prestamo.user);
    console.log('Empresa en usuario:', (prestamo.user as any)?.empresa);

    // Generar PDF con los datos obtenidos de Laravel
    const pdfBuffer = await generarPDFPrestamo(prestamo)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="PRESTAMO-${prestamo.numero}.pdf"`,
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
