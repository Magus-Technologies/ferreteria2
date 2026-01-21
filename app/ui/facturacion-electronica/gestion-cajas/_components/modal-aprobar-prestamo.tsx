'use client'

import { useState } from 'react'
import { Modal, Input, Button, Space, Select, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { Prestamo } from '~/lib/api/transacciones-caja'
import { useAprobarPrestamo } from '../_hooks/use-aprobar-prestamo'
import { useRechazarPrestamo } from '../_hooks/use-rechazar-prestamo'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'

const { TextArea } = Input

interface ModalAprobarPrestamoProps {
  prestamo: Prestamo
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalAprobarPrestamo({
  prestamo,
  open,
  onOpenChange,
}: ModalAprobarPrestamoProps) {
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [mostrarRechazo, setMostrarRechazo] = useState(false)
  const [subCajaOrigenId, setSubCajaOrigenId] = useState<number | null>(null)

  const aprobarMutation = useAprobarPrestamo()
  const rechazarMutation = useRechazarPrestamo()

  // Obtener mis cajas principales para seleccionar la sub-caja
  const { data: misCajas } = useQuery({
    queryKey: [QueryKeys.CAJAS_PRINCIPALES],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getAll()
      return response.data?.data || []
    },
  })

  // Encontrar mi caja principal (la que coincide con caja_principal_origen_id del préstamo)
  const miCajaPrincipal = misCajas?.find(
    (c) => c.id === prestamo.caja_principal_origen_id
  )
  const misSubCajas = miCajaPrincipal?.sub_cajas || []

  const handleAprobar = () => {
    if (!subCajaOrigenId) {
      message.error('Debes seleccionar de qué sub-caja prestarás el dinero')
      return
    }

    aprobarMutation.mutate(
      { prestamoId: prestamo.id, subCajaOrigenId },
      {
        onSuccess: () => {
          onOpenChange(false)
          setSubCajaOrigenId(null)
        },
      }
    )
  }

  const handleRechazar = () => {
    rechazarMutation.mutate(
      { prestamoId: prestamo.id, motivo: motivoRechazo },
      {
        onSuccess: () => {
          onOpenChange(false)
          setMotivoRechazo('')
          setMostrarRechazo(false)
        },
      }
    )
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto)
  }

  return (
    <Modal
      title="Solicitud de Préstamo"
      open={open}
      onCancel={() => onOpenChange(false)}
      width={600}
      footer={
        !mostrarRechazo ? (
          <Space>
            <Button
              icon={<CloseCircleOutlined />}
              onClick={() => setMostrarRechazo(true)}
              disabled={aprobarMutation.isPending}
            >
              Rechazar
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleAprobar}
              loading={aprobarMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprobar Préstamo
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              onClick={() => {
                setMostrarRechazo(false)
                setMotivoRechazo('')
              }}
              disabled={rechazarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              danger
              onClick={handleRechazar}
              loading={rechazarMutation.isPending}
            >
              Confirmar Rechazo
            </Button>
          </Space>
        )
      }
    >
      <div className="space-y-4 py-4">
        {/* Información del préstamo */}
        <div className="space-y-3 rounded-lg border p-4 bg-slate-50">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-slate-600">Monto solicitado</span>
            <span className="text-2xl font-bold text-emerald-600">
              {formatMonto(Number(prestamo.monto))}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Solicitante:</span>
              <span className="font-medium">{prestamo.user_recibe.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">Para su caja:</span>
              <span className="font-medium">{prestamo.sub_caja_destino.nombre}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">Fecha:</span>
              <span className="font-medium">
                {format(new Date(prestamo.fecha_prestamo), "d 'de' MMMM, HH:mm", {
                  locale: es,
                })}
              </span>
            </div>

            {prestamo.motivo && (
              <div className="pt-2 border-t">
                <span className="text-slate-600">Motivo:</span>
                <p className="mt-1 text-sm">{prestamo.motivo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Selector de sub-caja origen */}
        {!mostrarRechazo && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              ¿De qué sub-caja prestarás el dinero? *
            </label>
            <Select
              className="w-full"
              placeholder="Selecciona tu sub-caja"
              value={subCajaOrigenId}
              onChange={setSubCajaOrigenId}
              showSearch
              optionFilterProp="children"
            >
              {misSubCajas.map((subCaja) => (
                <Select.Option key={subCaja.id} value={subCaja.id}>
                  {subCaja.nombre} - S/ {subCaja.saldo_actual}
                </Select.Option>
              ))}
            </Select>
            {subCajaOrigenId && (
              <p className="text-xs text-slate-500">
                Saldo disponible: S/{' '}
                {misSubCajas.find((sc) => sc.id === subCajaOrigenId)?.saldo_actual}
              </p>
            )}
          </div>
        )}

        {/* Formulario de rechazo */}
        {mostrarRechazo && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo del rechazo (opcional)</label>
            <TextArea
              placeholder="Explica por qué rechazas esta solicitud..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
