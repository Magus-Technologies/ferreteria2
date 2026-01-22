'use client'

import { Badge, Button, Popover, Spin } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { usePrestamosPendientes } from '../_hooks/use-prestamos-pendientes'
import { ModalAprobarPrestamo } from './modal-aprobar-prestamo'
import { useState } from 'react'
import type { Prestamo } from '~/lib/api/transacciones-caja'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function NotificacionPrestamosPendientes() {
  const { data, isLoading } = usePrestamosPendientes()
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const prestamos = data?.data || []
  const count = prestamos.length

  if (isLoading || count === 0) {
    return null
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto)
  }

  const content = (
    <div className="w-96">
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h4 className="font-semibold text-base">Préstamos Pendientes</h4>
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {prestamos.map((prestamo) => (
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
        ))}
      </div>
    </div>
  )

  return (
    <>
      <Popover content={content} title={null} trigger="click" placement="bottomRight">
        <Badge count={count} offset={[-5, 5]}>
          <Button
            type="default"
            shape="circle"
            icon={<BellOutlined style={{ fontSize: '18px' }} />}
            size="large"
          />
        </Badge>
      </Popover>

      {prestamoSeleccionado && (
        <ModalAprobarPrestamo
          prestamo={prestamoSeleccionado}
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open)
            if (!open) setPrestamoSeleccionado(null)
          }}
        />
      )}
    </>
  )
}
