import { useState, useEffect } from 'react'
import { message } from 'antd'
import { cajaApi } from '~/lib/api/caja'
import { authApi } from '~/lib/api'
import { AperturarCajaFormValues } from '../_components/modals/modal-aperturar-caja'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { AperturaDataResponse } from '../_components/modals/modal-ticket-apertura'

export default function useAperturarCaja({
  onSuccess,
}: {
  onSuccess?: (data: AperturaDataResponse) => void
}) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    // Obtener el usuario actual al montar el componente
    const fetchUser = async () => {
      try {
        const response = await authApi.getUser()
        if (response.data?.id) {
          setUserId(response.data.id)
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error)
      }
    }
    fetchUser()
  }, [])

  async function crearAperturarCaja(
    values: AperturarCajaFormValues & { 
      enviarTicket?: boolean
      emailDestino?: string 
    },
    empresaData?: any
  ) {
    setLoading(true)
    try {
      // Calcular el monto total
      const montoTotal = values.vendedores.reduce((sum, v) => sum + v.monto, 0)

      // Si hay un solo vendedor, usar su conteo como conteo_apertura_billetes_monedas
      const conteoApertura = values.vendedores.length === 1 
        ? values.vendedores[0].conteo_billetes_monedas 
        : null

      // Preparar los datos para el backend
      const payload = {
        caja_principal_id: values.caja_origen_id,
        monto_apertura: montoTotal,
        conteo_billetes_monedas: conteoApertura, // Agregar conteo a nivel de apertura
        vendedores: values.vendedores.map(v => ({
          user_id: v.user_id,
          monto: v.monto,
          conteo_billetes_monedas: v.conteo_billetes_monedas || null,
        })),
      }

      const response = await cajaApi.aperturar(payload)

      if (response.data?.data) {
        // Transformar datos para el ticket PRIMERO
        const backendData = response.data.data as any
        
        // Validar que tenemos un ID válido
        if (!backendData.id) {
          console.error('❌ No se recibió ID de apertura del backend:', backendData)
          message.error('Error: No se pudo obtener el ID de la apertura')
          return
        }
        
        const aperturaData: AperturaDataResponse = {
          id: backendData.id, // Keep as-is (ULID string or number)
          fecha_apertura: backendData.fecha_apertura || new Date().toISOString(),
          estado: backendData.estado || 'abierta',
          monto_apertura: parseFloat(backendData.monto_apertura) || 0,
          conteo_apertura_billetes_monedas: backendData.conteo_apertura_billetes_monedas || null,
          caja_principal: backendData.caja_principal || { 
            id: 0, 
            codigo: '', 
            nombre: '' 
          },
          user: backendData.user || { 
            id: userId || '', 
            name: 'Usuario' 
          },
          distribuciones_vendedores: (backendData.distribuciones || []).map((d: any) => ({
            vendedor_id: d.vendedor_id,
            vendedor_nombre: d.vendedor,
            monto_asignado: parseFloat(d.monto) || 0,
            conteo_billetes_monedas: d.conteo_billetes_monedas,
          })),
        }
        
        // Transformar datos para el PDF (compatible con AperturaDataPDF)
        const aperturaDataPDF = {
          id: aperturaData.id,
          fecha_apertura: aperturaData.fecha_apertura,
          monto_apertura: aperturaData.monto_apertura,
          conteo_apertura_billetes_monedas: aperturaData.conteo_apertura_billetes_monedas,
          caja_principal: aperturaData.caja_principal,
          user: aperturaData.user,
          distribuciones_vendedores: (aperturaData.distribuciones_vendedores || []).map(d => ({
            vendedor: d.vendedor_nombre,
            monto: d.monto_asignado,
            conteo_billetes_monedas: d.conteo_billetes_monedas,
          })),
        }

        // Si hay email, enviar el ticket automáticamente
        if (values.enviarTicket && values.emailDestino && empresaData) {
          try {
            console.log('📧 Generando y enviando ticket automáticamente...')
            
            // Generar el PDF usando react-pdf
            const { pdf } = await import('@react-pdf/renderer')
            const { default: DocAperturaTicket } = await import('../_components/docs/doc-apertura-ticket')
            const React = await import('react')
            
            // Crear el documento PDF
            const doc = React.createElement(DocAperturaTicket, {
              data: aperturaDataPDF,
              nro_doc: String(aperturaData.id),
              empresa: empresaData,
              show_logo_html: false
            })
            
            // Generar el blob del PDF
            const pdfBlob = await pdf(doc as any).toBlob()
            
            // Enviar el PDF al backend
            await cajaApi.enviarTicketAperturaEmail(String(aperturaData.id), values.emailDestino, pdfBlob)
            
            console.log('✅ Ticket enviado automáticamente a:', values.emailDestino)
            message.success(`Ticket enviado a ${values.emailDestino}`)
          } catch (emailError) {
            console.error('⚠️ Error al enviar ticket automáticamente:', emailError)
            message.warning('Apertura exitosa, pero no se pudo enviar el email')
            // No fallar la apertura si falla el envío del email
          }
        }

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.SUB_CAJAS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS_TODAS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })

        message.success(`Efectivo distribuido exitosamente a ${values.vendedores.length} vendedor(es)`)

        // Llamar onSuccess con los datos completos
        onSuccess?.(aperturaData)
      } else {
        message.error('Error al distribuir efectivo')
      }
    } catch (error) {
      console.error('❌ HOOK: Error capturado en catch:', error)
      console.error('❌ HOOK: Error stack:', (error as Error)?.stack)
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
