'use client'

import { useState, useEffect } from 'react'
import { Modal, Radio, Button, Input } from 'antd'
import { FaCheck, FaUser, FaWarehouse, FaTruck } from 'react-icons/fa'
import {
  entregaProductoApi,
  EstadoEntrega,
  QuienEntrega,
} from '~/lib/api/entrega-producto'
import useApp from 'antd/es/app/useApp'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface ModalMarcarEntregadaProps {
  open: boolean
  onClose: () => void
  entrega?: any
  onSuccess?: () => void
}

export default function ModalMarcarEntregada({
  open,
  onClose,
  entrega,
  onSuccess,
}: ModalMarcarEntregadaProps) {
  const { message } = useApp()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [quienEntrega, setQuienEntrega] = useState<QuienEntrega>(
    QuienEntrega.ALMACEN,
  )
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    if (open) {
      const tipoEntrega = entrega?.tipo_entrega
      if (tipoEntrega === 'rt') {
        setQuienEntrega(QuienEntrega.ALMACEN)
      } else if (tipoEntrega === 'de') {
        setQuienEntrega(
          entrega?.chofer_id ? QuienEntrega.CHOFER : QuienEntrega.ALMACEN,
        )
      }
      setObservaciones(entrega?.observaciones || '')
    }
  }, [open, entrega])

  if (!entrega) return null

  const ventaNumero =
    entrega.venta?.serie && entrega.venta?.numero
      ? `${entrega.venta.serie}-${entrega.venta.numero}`
      : 'S/N'
  const tipoEntrega = entrega.tipo_entrega
  const esRecojoTienda = tipoEntrega === 'rt'

  const opciones = esRecojoTienda
    ? [
        {
          value: QuienEntrega.ALMACEN,
          label: 'Almacén',
          icon: <FaWarehouse />,
        },
        {
          value: QuienEntrega.VENDEDOR,
          label: 'Vendedor',
          icon: <FaUser />,
        },
      ]
    : [
        {
          value: QuienEntrega.CHOFER,
          label: 'Chofer',
          icon: <FaTruck />,
        },
        {
          value: QuienEntrega.ALMACEN,
          label: 'Almacén',
          icon: <FaWarehouse />,
        },
        {
          value: QuienEntrega.VENDEDOR,
          label: 'Vendedor',
          icon: <FaUser />,
        },
      ]

  const handleConfirmar = async () => {
    setLoading(true)
    try {
      const response = await entregaProductoApi.update(entrega.id, {
        estado_entrega: EstadoEntrega.ENTREGADO,
        quien_entrega: quienEntrega,
        ...(observaciones !== entrega.observaciones
          ? { observaciones: observaciones || undefined }
          : {}),
      })

      if (response.error) {
        message.error(response.error.message || 'Error al marcar entregada')
        return
      }

      message.success('Entrega marcada como entregada')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al marcar entregada:', error)
      message.error('Error al marcar entregada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <FaCheck className="text-green-600 text-lg" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 leading-tight">
              Marcar Entregada
            </div>
            <span className="text-green-600 text-xs font-mono">
              Venta {ventaNumero}
            </span>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={520}
      centered
      destroyOnHidden
      footer={
        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={onClose}
            className="!rounded-lg !h-10 !px-5 !font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={handleConfirmar}
            loading={loading}
            className="!rounded-lg !h-10 !px-6 !font-bold !bg-green-600 hover:!bg-green-700 !border-none"
          >
            Confirmar Entrega
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-amber-800 font-semibold text-sm">
            ¿Confirmar que los productos fueron entregados al cliente?
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 tracking-wide mb-2">
            ¿Quién entregó?
          </label>
          <Radio.Group
            value={quienEntrega}
            onChange={(e) => setQuienEntrega(e.target.value)}
            className="!w-full"
          >
            <div className="grid grid-cols-1 gap-2">
              {opciones.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  className={`!w-full !p-3 !rounded-lg !border ${
                    quienEntrega === opt.value
                      ? '!border-green-500 !bg-green-50'
                      : '!border-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-500">{opt.icon}</span>
                    {opt.label}
                  </span>
                </Radio>
              ))}
            </div>
          </Radio.Group>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 tracking-wide mb-2">
            Observaciones (opcional)
          </label>
          <Input.TextArea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Agregar nota..."
            maxLength={500}
            showCount
          />
        </div>
      </div>
    </Modal>
  )
}
