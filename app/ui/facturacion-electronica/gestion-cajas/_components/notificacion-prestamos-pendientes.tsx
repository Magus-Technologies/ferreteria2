'use client'

import { Badge, Dropdown } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { prestamoVendedorApi, type SolicitudEfectivo } from '~/lib/api/prestamo-vendedor'
import ModalAprobarSolicitudEfectivo from './modal-aprobar-solicitud-efectivo'

export function NotificacionPrestamosPendientes() {
  const [openAprobar, setOpenAprobar] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEfectivo | null>(null)

  const { data: solicitudesData, refetch } = useQuery({
    queryKey: ['solicitudes-efectivo-pendientes'],
    queryFn: async () => {
      const result = await prestamoVendedorApi.solicitudesPendientes()
      return result.data || []
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  // Asegurar que solicitudes sea siempre un array
  const solicitudes = Array.isArray(solicitudesData) ? solicitudesData : []

  const handleAprobar = (solicitud: SolicitudEfectivo) => {
    setSelectedSolicitud(solicitud)
    setOpenAprobar(true)
  }

  const handleRechazar = async (solicitudId: number) => {
    await prestamoVendedorApi.rechazarSolicitud(solicitudId)
    refetch()
  }

  const items = solicitudes.map((solicitud) => ({
    key: String(solicitud.id),
    label: (
      <div className='py-2 px-1 min-w-[300px]'>
        <div className='flex justify-between items-start mb-2'>
          <div>
            <p className='font-semibold text-sm'>{solicitud.vendedor_solicitante.name}</p>
            <p className='text-xs text-gray-500'>
              Solicita S/. {solicitud.monto_solicitado.toFixed(2)}
            </p>
          </div>
          <span className='text-xs text-gray-400'>
            {new Date(solicitud.created_at).toLocaleDateString()}
          </span>
        </div>
        {solicitud.motivo && (
          <p className='text-xs text-gray-600 mb-2 italic'>"{solicitud.motivo}"</p>
        )}
        <div className='flex gap-2'>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAprobar(solicitud)
            }}
            className='flex-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600'
          >
            Aprobar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRechazar(solicitud.id)
            }}
            className='flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600'
          >
            Rechazar
          </button>
        </div>
      </div>
    ),
  }))

  if (solicitudes.length === 0) {
    items.push({
      key: 'empty',
      label: (
        <div className='py-2 px-1 text-center text-gray-500 text-sm'>
          No hay solicitudes pendientes
        </div>
      ),
    })
  }

  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']} placement='bottomRight'>
        <button className='relative p-2 hover:bg-amber-700 rounded-full transition-colors'>
          <Badge count={solicitudes.length} offset={[-5, 5]}>
            <BellOutlined className='text-white text-xl' />
          </Badge>
        </button>
      </Dropdown>

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
