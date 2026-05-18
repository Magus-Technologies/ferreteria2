import { apiRequest, type ApiResponse } from '~/lib/api'

export type TipoDocumentoEmail = 'venta' | 'cotizacion' | 'prestamo' | 'guia' | 'nota-credito' | 'nota-debito'

export const documentoEmailApi = {
  enviarEmail: (params: {
    tipo: TipoDocumentoEmail
    id: string
    email: string
    formato?: 'ticket' | 'a4'
    mensaje?: string
    columnas?: string[]
  }) =>
    apiRequest<{ message: string }>('/documentos/enviar-email', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
}
