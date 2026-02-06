'use client'

import { Badge, Popover } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { prestamoVendedorApi, type SolicitudEfectivo } from '~/lib/api/prestamo-vendedor'
import ModalAprobarSolicitudEfectivo from './modal-aprobar-solicitud-efectivo'

export function NotificacionPrestamosPendientes() {
  const [openAprobar, setOpenAprobar] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEfectivo | null>(null)

  const { data, refetch, isError, error } = useQuery({
    queryKey: ['solicitudes-efectivo-pendientes'],
    queryFn: async () => {
      console.log('🔔 Llamando a solicitudesPendientes...')
      const response = await prestamoVendedorApi.solicitudesPendientes()
      console.log('🔔 Respuesta solicitudes pendientes:', response)
      console.log('🔔 response.data:', response.data)
      console.log('🔔 Array.isArray(response.data):', Array.isArray(response.data))
      return response
    },
    refetchInterval: 30000, // Refetch cada 30 segundos
    retry: 1, // Solo reintentar una vez
  })

  // La respuesta tiene estructura: {data: {success: true, data: [...]}}
  const solicitudes = Array.isArray(data?.data) ? data.data : []

  console.log('🔔 Solicitudes procesadas:', solicitudes)
  console.log('🔔 Cantidad de solicitudes:', solicitudes.length)
  console.log('🔔 isError:', isError)
  console.log('🔔 error:', error)

  // Si hay error, no mostrar el componente
  if (isError) {
    return null
  }

  const handleAprobar = (solicitud: SolicitudEfectivo) => {
    setSelectedSolicitud(solicitud)
    setOpenAprobar(true)
  }

  const handleRechazar = async (solicitudId: string) => {
    await prestamoVendedorApi.rechazarSolicitud(solicitudId)
    refetch()
  }

  const content = (
    <div className="w-96">
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h4 className="font-semibold text-base">Solicitudes de Efectivo</h4>
        <Badge count={solicitudes.length} style={{ backgroundColor: '#52c41a' }} />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {solicitudes.map((solicitud: SolicitudEfectivo) => (
          <div
            key={solicitud.id}
            className="border rounded-lg p-3 space-y-2 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{solicitud.vendedor_solicitante.name}</p>
                <p className="text-xs text-slate-500">Solicita efectivo</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">
                S/ {solicitud.monto_solicitado.toFixed(2)}
              </p>
            </div>

            {solicitud.motivo && (
              <p className="text-xs text-gray-600 italic">"{solicitud.motivo}"</p>
            )}

            <div className="text-xs text-gray-400">
              {new Date(solicitud.created_at).toLocaleDateString('es-PE', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAprobar(solicitud)
                }}
                className="flex-1 px-3 py-1.5 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
              >
                Aprobar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRechazar(solicitud.id)
                }}
                className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}

        {solicitudes.length === 0 && (
          <div className="py-4 text-center text-slate-500 text-sm">
            No hay solicitudes pendientes
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Popover content={content} trigger="click" placement="bottomRight">
        <button className="relative p-2 hover:bg-amber-700 rounded-full transition-colors">
          <Badge count={solicitudes.length} offset={[-5, 5]}>
            <BellOutlined className="text-white text-xl" />
          </Badge>
        </button>
      </Popover>

      {selectedSolicitud && (
        <ModalAprobarSolicitudEfectivo
          solicitudId={selectedSolicitud.id}
          open={openAprobar}
          setOpen={setOpenAprobar}
          montoSolicitado={selectedSolicitud.monto_solicitado}
          solicitanteNombre={selectedSolicitud.vendedor_solicitante.name}
          onSuccess={() => refetch()}
        />
      )}
    </>
  )
}
