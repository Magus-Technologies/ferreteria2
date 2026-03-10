import { getAuthToken } from '~/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Abrir un PDF generado por el backend Laravel en una nueva pestana.
 * Usa fetch con el token de autenticacion y crea un blob URL.
 */
export async function abrirPdf(
  tipo: 'venta' | 'compra' | 'cotizacion' | 'prestamo' | 'vale',
  id: string | number,
): Promise<void> {
  const token = getAuthToken()
  const url = `${API_URL}/pdf/${tipo}/${id}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    },
  })

  if (!response.ok) {
    throw new Error(`Error al generar PDF: ${response.status}`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank')

  // Liberar el blob URL despues de un tiempo
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
}
