import { NextResponse } from 'next/server'

/**
 * GET /api/qz/status
 * Verificar estado del sistema de certificados QZ Tray
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
    const response = await fetch(`${backendUrl}/api/qz/status`)
    
    if (!response.ok) {
      throw new Error(`Error al obtener estado: ${response.status}`)
    }
    
    const status = await response.json()
    
    return NextResponse.json({
      ...status,
      frontend_url: process.env.NEXT_PUBLIC_API_URL,
      backend_url: backendUrl,
    })
  } catch (error) {
    console.error('Error obteniendo estado QZ:', error)
    return NextResponse.json(
      { 
        error: 'No se pudo obtener el estado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
