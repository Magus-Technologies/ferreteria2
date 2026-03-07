import { NextResponse } from 'next/server'

/**
 * GET /api/qz/certificate
 * Proxy para obtener el certificado desde el backend Laravel
 */
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!backendUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_API_BASE_URL no está configurado' },
        { status: 500 }
      )
    }
    
    const response = await fetch(`${backendUrl}/api/qz/certificate`, {
      cache: 'force-cache', // Cache agresivo
      next: { revalidate: 86400 }, // Revalidar cada 24 horas
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error del backend:', errorText)
      throw new Error(`Error al obtener certificado: ${response.status}`)
    }
    
    const certificate = await response.text()
    
    return new NextResponse(certificate, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400', // Cache 24 horas
      },
    })
  } catch (error) {
    console.error('Error obteniendo certificado QZ:', error)
    return NextResponse.json(
      { 
        error: 'No se pudo obtener el certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
