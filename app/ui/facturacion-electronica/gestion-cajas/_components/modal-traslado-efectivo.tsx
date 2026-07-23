'use client'

import { useState } from 'react'
import { Modal, Form, InputNumber, Select, Input, Button, message } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { useCrearMovimientoInterno } from '~/app/ui/facturacion-electronica/gestion-cajas/_hooks/use-crear-movimiento-interno'

interface MetodoParaVenta {
  value: string
  label: string
  sub_caja_id: number
  despliegue_pago_id: string
  sub_caja_nombre: string
  banco: string
  metodo: string
  tipo: string
}

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Traslado de Efectivo: mueve efectivo físico entre sub-cajas apuntando al
 * "tipo de pago" destino (ej. CAJA CHICA/EFECTIVO → EFECTIVO NEGRO), para que
 * ese destino tenga saldo y se pueda pagar sin caer en negativo. Permite mover
 * el TOTAL del saldo actual (no aplica la regla de caja cerrada: es dinero
 * físicamente presente).
 */
export default function ModalTrasladoEfectivo({ open, setOpen, onSuccess }: Props) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { mutate: crearMovimiento, isPending } = useCrearMovimientoInterno()
  const [origenValue, setOrigenValue] = useState<string | null>(null)

  // Combos "SUBCAJA/BANCO/MÉTODO" — solo los de tipo EFECTIVO
  const { data: metodosEfectivo = [] } = useQuery({
    queryKey: ['metodos-para-ventas-efectivo'],
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: MetodoParaVenta[] }>(
        '/cajas/sub-cajas/metodos-para-ventas'
      )
      return (res.data?.data || []).filter((m) => m.tipo === 'efectivo')
    },
    enabled: open,
  })

  // Saldos por sub-caja (para mostrar el saldo actual y el botón "Usar total")
  const { data: saldos = [] } = useQuery({
    queryKey: ['saldos-disponibles-movimiento'],
    queryFn: async () => {
      const response = await transaccionesCajaApi.getSaldosDisponiblesMovimiento()
      return response.data?.data || []
    },
    enabled: open,
  })

  const origen = metodosEfectivo.find((m) => m.value === origenValue)
  const saldoOrigen = origen
    ? saldos.find((s) => s.sub_caja_id === origen.sub_caja_id)?.saldo_actual ?? 0
    : 0

  // El destino debe ser otra SUB-CAJA (el backend exige origen ≠ destino)
  const destinosDisponibles = metodosEfectivo.filter(
    (m) => m.sub_caja_id !== origen?.sub_caja_id
  )

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const destino = metodosEfectivo.find((m) => m.value === values.destino)
      if (!origen || !destino) return

      crearMovimiento(
        {
          sub_caja_origen_id: origen.sub_caja_id,
          sub_caja_destino_id: destino.sub_caja_id,
          despliegue_de_pago_origen_id: origen.despliegue_pago_id,
          despliegue_de_pago_destino_id: destino.despliegue_pago_id,
          monto: values.monto,
          concepto: 'TRASLADO DE EFECTIVO',
          justificacion: values.justificacion,
        },
        {
          onSuccess: () => {
            message.success('Efectivo trasladado correctamente')
            form.resetFields()
            setOrigenValue(null)
            onSuccess?.()
            setOpen(false)
          },
          onError: (error: any) => {
            message.error(error.message || 'Error al trasladar el efectivo')
          },
        }
      )
    } catch {
      // errores de validación del form
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setOrigenValue(null)
    setOpen(false)
  }

  return (
    <Modal
      title="Traslado de Efectivo"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Trasladar"
      cancelText="Cancelar"
      width={600}
    >
      <p className="text-xs text-slate-500 mb-4">
        Mueve efectivo físico entre sub-cajas para poder pagar desde el destino.
        Permite usar el <strong>total</strong> del saldo actual.
      </p>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Origen (efectivo)"
          name="origen"
          rules={[{ required: true, message: 'Seleccione el origen' }]}
        >
          <Select
            placeholder="Seleccione origen"
            showSearch
            optionFilterProp="label"
            onChange={(value) => {
              setOrigenValue(value)
              form.setFieldValue('destino', undefined)
            }}
            options={metodosEfectivo.map((m) => ({
              value: m.value,
              label: `${m.label} — S/ ${(saldos.find((s) => s.sub_caja_id === m.sub_caja_id)?.saldo_actual ?? 0).toFixed(2)}`,
            }))}
          />
        </Form.Item>

        {origen && (
          <div className="mb-4 p-3 bg-emerald-50 rounded border border-emerald-200">
            <p className="text-sm text-gray-600 m-0">
              Saldo actual en <strong>{origen.sub_caja_nombre}</strong>:{' '}
              <span className="font-semibold text-emerald-700">S/ {Number(saldoOrigen).toFixed(2)}</span>
            </p>
          </div>
        )}

        <Form.Item
          label="Destino (efectivo)"
          name="destino"
          rules={[{ required: true, message: 'Seleccione el destino' }]}
        >
          <Select
            placeholder="Seleccione destino (donde quieres poner el efectivo)"
            disabled={!origen}
            showSearch
            optionFilterProp="label"
            options={destinosDisponibles.map((m) => ({ value: m.value, label: m.label }))}
          />
        </Form.Item>

        <Form.Item
          label="Monto a Trasladar"
          required
        >
          <div className="flex gap-2">
            <Form.Item
              name="monto"
              noStyle
              rules={[
                { required: true, message: 'Ingrese el monto' },
                {
                  validator: (_, value) => {
                    if (!origen) return Promise.resolve()
                    if (value > Number(saldoOrigen)) {
                      return Promise.reject(`El monto excede el saldo actual (S/ ${Number(saldoOrigen).toFixed(2)})`)
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <InputNumber
                className="flex-1 !w-full"
                placeholder="0.00"
                min={0.01}
                step={0.01}
                precision={2}
                prefix="S/"
              />
            </Form.Item>
            <Button
              disabled={!origen || Number(saldoOrigen) <= 0}
              onClick={() => form.setFieldValue('monto', Number(saldoOrigen))}
            >
              Usar total
            </Button>
          </div>
        </Form.Item>

        <Form.Item
          label="Justificación"
          name="justificacion"
          rules={[{ required: true, message: 'Ingrese una justificación' }]}
        >
          <Input.TextArea
            placeholder="Ej: Trasladar efectivo a efectivo negro para pagar compra"
            rows={2}
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
