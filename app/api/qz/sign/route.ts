import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/qz/sign
 * Proxy para firmar peticiones de QZ Tray desde el backend Laravel
 */
export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()
    
    if (!data) {
      return NextResponse.json(
        { error: 'Datos requeridos para firmar' },
        { status: 400 }
      )
    }
    
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!backendUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_API_BASE_URL no está configurado' },
        { status: 500 }
      )
    }
    
    const response = await fetch(`${backendUrl}/api/qz/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error del backend:', errorText)
      throw new Error(`Error al firmar petición: ${response.status}`)
    }
    
    const signature = await response.text()
    
    return new NextResponse(signature, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error firmando petición QZ:', error)
    return NextResponse.json(
      { 
        error: 'No se pudo firmar la petición',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
