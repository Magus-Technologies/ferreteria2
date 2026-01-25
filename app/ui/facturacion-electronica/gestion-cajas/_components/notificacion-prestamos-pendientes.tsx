'use client'

import { Badge, Button, Popover } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { prestamoVendedorApi, type SolicitudEfectivo } from '~/lib/api/prestamo-vendedor'
import ModalAprobarSolicitudEfectivo from './modal-aprobar-solicitud-efectivo'

export function NotificacionPrestamosPendientes() {
  const [openAprobar, setOpenAprobar] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEfectivo | null>(null)

  // data ahora es directamente Prestamo[]
  const prestamos = data || []
  const count = prestamos.length

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

  const content = (
    <div className="w-96">
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h4 className="font-semibold text-base">Préstamos Pendientes</h4>
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {prestamos.map((prestamo: Prestamo) => (
          <div
            key={prestamo.id}
            className="border rounded-lg p-3 space-y-2 hover:bg-slate-50 cursor-pointer transition-colors"
            onClick={() => {
              setPrestamoSeleccionado(prestamo)
              setModalOpen(true)
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{prestamo.user_recibe.name}</p>
                <p className="text-xs text-slate-500">Solicita préstamo de tu caja</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">
                {formatMonto(Number(prestamo.monto))}
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-medium">De:</span>{' '}
                {prestamo.sub_caja_origen?.nombre || 'Por definir al aprobar'}
              </p>
              <p>
                <span className="font-medium">Para:</span> {prestamo.sub_caja_destino.nombre}
              </p>
              {prestamo.motivo && (
                <p>
                  <span className="font-medium">Motivo:</span> {prestamo.motivo}
                </p>
              )}
              <p className="text-slate-400">
                {format(new Date(prestamo.fecha_prestamo), "d 'de' MMMM, HH:mm", {
                  locale: es,
                })}
              </p>
            </div>
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
