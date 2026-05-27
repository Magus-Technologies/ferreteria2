import { useState } from 'react'
import { message } from 'antd'
import { cajaApi } from '~/lib/api/caja'
import { AperturarCajaFormValues } from '../_components/modals/modal-aperturar-caja'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getAuthToken } from '~/lib/api'
import { useAuth } from '~/lib/auth-context'

export interface AperturaDataResponse {
  id: string | number
  fecha_apertura: string
  estado: string
  monto_apertura: number
  conteo_apertura_billetes_monedas?: unknown
  caja_principal: {
    id: number
    codigo: string
    nombre: string
  }
  user: {
    id: string
    name: string
  }
  distribuciones_vendedores?: Array<{
    vendedor_id: string
    vendedor_nombre: string
    monto_asignado: number
    conteo_billetes_monedas?: unknown
  }>
}

type BackendDistribucionApertura = {
  vendedor_id?: string
  vendedor?: string
  monto?: string | number
  conteo_billetes_monedas?: unknown
}

type BackendAperturaData = {
  id?: string | number
  fecha_apertura?: string
  estado?: string
  monto_apertura?: string | number
  conteo_apertura_billetes_monedas?: unknown
  caja_principal?: AperturaDataResponse['caja_principal']
  user?: AperturaDataResponse['user']
  distribuciones?: BackendDistribucionApertura[]
}

async function enviarTicketAperturaEnSegundoPlano(
  aperturaData: AperturaDataResponse,
  emailDestino: string
) {
  const messageKey = `ticket-apertura-${aperturaData.id}`

  message.loading({
    key: messageKey,
    content: 'Generando ticket y enviando correo...',
    duration: 0,
  })

  try {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const pdfRes = await fetch(`${API_URL}/pdf/apertura-caja/${aperturaData.id}?formato=ticket`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    })

    if (!pdfRes.ok) throw new Error(`Error PDF: ${pdfRes.status}`)

    const pdfBlob = await pdfRes.blob()
    await cajaApi.enviarTicketAperturaEmail(String(aperturaData.id), emailDestino, pdfBlob)

    message.success({
      key: messageKey,
      content: `Ticket enviado a ${emailDestino}`,
      duration: 4,
    })
  } catch (emailError) {
    console.error('Error al enviar ticket de apertura:', emailError)
    message.warning({
      key: messageKey,
      content: 'La distribucion se guardo, pero no se pudo enviar el ticket por correo',
      duration: 6,
    })
  }
}

export default function useAperturarCaja({
  onSuccess,
}: {
  onSuccess?: (data: AperturaDataResponse) => void
}) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()

  async function crearAperturarCaja(
    values: AperturarCajaFormValues & {
      enviarTicket?: boolean
      emailDestino?: string
    },
    empresaData?: unknown
  ) {
    setLoading(true)

    try {
      const montoTotal = values.vendedores.reduce((sum, vendedor) => sum + vendedor.monto, 0)
      const conteoApertura = values.vendedores.length === 1
        ? values.vendedores[0].conteo_billetes_monedas
        : null

      void empresaData

      const payload = {
        caja_principal_id: values.caja_origen_id,
        monto_apertura: montoTotal,
        conteo_billetes_monedas: conteoApertura,
        enviar_ticket: false,
        vendedores: values.vendedores.map(vendedor => ({
          user_id: vendedor.user_id,
          monto: vendedor.monto,
          conteo_billetes_monedas: vendedor.conteo_billetes_monedas || null,
        })),
      }

      const response = await cajaApi.aperturar(payload)

      if (response.error) {
        message.error(response.error.message || 'Error al distribuir efectivo')
        return
      }

      const backendData = response.data?.data as BackendAperturaData | undefined

      if (!backendData?.id) {
        console.error('No se recibio ID de apertura del backend:', backendData)
        message.error('Error: No se pudo obtener el ID de la apertura')
        return
      }

      const aperturaData: AperturaDataResponse = {
        id: backendData.id,
        fecha_apertura: backendData.fecha_apertura || new Date().toISOString(),
        estado: backendData.estado || 'abierta',
        monto_apertura: Number(backendData.monto_apertura ?? 0),
        conteo_apertura_billetes_monedas: backendData.conteo_apertura_billetes_monedas || null,
        caja_principal: backendData.caja_principal || {
          id: 0,
          codigo: '',
          nombre: '',
        },
        user: backendData.user || {
          id: userId || '',
          name: 'Usuario',
        },
        distribuciones_vendedores: (backendData.distribuciones || []).map((distribucion) => ({
          vendedor_id: distribucion.vendedor_id || '',
          vendedor_nombre: distribucion.vendedor || 'N/A',
          monto_asignado: Number(distribucion.monto ?? 0),
          conteo_billetes_monedas: distribucion.conteo_billetes_monedas,
        })),
      }

      queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SUB_CAJAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS_TODAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })

      message.success(`Efectivo distribuido exitosamente a ${values.vendedores.length} vendedor(es)`)
      onSuccess?.(aperturaData)

      if (values.enviarTicket && values.emailDestino) {
        void enviarTicketAperturaEnSegundoPlano(aperturaData, values.emailDestino)
      }
    } catch (error) {
      console.error('Error al aperturar caja:', error)
      message.error('Error inesperado al distribuir efectivo')
    } finally {
      setLoading(false)
    }
  }

  return {
    crearAperturarCaja,
    loading,
    userId,
  }
}
