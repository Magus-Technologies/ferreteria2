import { NextRequest, NextResponse } from 'next/server'
import { generarPDFCotizacion } from '~/lib/pdf/generar-pdf-cotizacion'

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacionId } = await params

    // Obtener cotización desde Laravel API (ruta pública)
    const response = await fetch(`${API_URL}/cotizaciones/${cotizacionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      console.error('Error al obtener cotización:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Cotización no encontrada' },
        { status: response.status }
      )
    }

    const data = await response.json();
    console.log('Datos recibidos de Laravel (cotización):', JSON.stringify(data, null, 2));
    const cotizacion = data.data;

    if (!cotizacion) {
      console.error('No se encontró cotización en data.data');
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('Usuario en cotización:', cotizacion.user);
    console.log('Empresa en usuario:', cotizacion.user?.empresa);

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
