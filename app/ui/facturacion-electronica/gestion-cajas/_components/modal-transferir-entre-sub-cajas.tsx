'use client'

import { useState } from 'react'
import { Modal, Form, InputNumber, Select, Input, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { SubCaja } from '~/lib/api/caja-principal'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useCrearMovimientoInterno } from '~/app/ui/facturacion-electronica/gestion-cajas/_hooks/use-crear-movimiento-interno'

interface Props {
  open: boolean
  onClose: () => void
  subCajas: SubCaja[]
  cajaPrincipalId: number
}

export default function ModalTransferirEntreSubCajas({
  open,
  onClose,
  subCajas,
  cajaPrincipalId,
}: Props) {
  const [form] = Form.useForm()
  const { mutate: crearMovimiento, isPending } = useCrearMovimientoInterno()
  const [subCajaOrigenId, setSubCajaOrigenId] = useState<number | null>(null)

  // Obtener métodos de pago
  const { data: metodosPago } = useQuery({
    queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
    queryFn: async () => {
      const response = await despliegueDePagoApi.getAll()
      return response.data?.data || []
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      crearMovimiento(
        {
          sub_caja_origen_id: values.sub_caja_origen_id,
          sub_caja_destino_id: values.sub_caja_destino_id,
          monto: values.monto,
          justificacion: values.justificacion,
          comprobante: values.comprobante,
          despliegue_de_pago_id: values.despliegue_de_pago_id,
        },
        {
          onSuccess: () => {
            message.success('Movimiento interno realizado exitosamente')
            form.resetFields()
            setSubCajaOrigenId(null)
            onClose()
          },
          onError: (error: any) => {
            message.error(error.message || 'Error al realizar el movimiento')
          },
        }
      )
    } catch (error) {
      console.error('Error de validación:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setSubCajaOrigenId(null)
    onClose()
  }

  const subCajaOrigen = subCajas.find((sc) => sc.id === subCajaOrigenId)
  const subCajasDestino = subCajas.filter((sc) => sc.id !== subCajaOrigenId)

  return (
    <Modal
      title="Movimiento Interno entre Sub-Cajas"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Realizar Movimiento"
      cancelText="Cancelar"
      width={600}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Sub-Caja Origen"
          name="sub_caja_origen_id"
          rules={[{ required: true, message: 'Seleccione la sub-caja origen' }]}
        >
          <Select
            placeholder="Seleccione sub-caja origen"
            onChange={(value) => setSubCajaOrigenId(value)}
            showSearch
            optionFilterProp="children"
          >
            {subCajas.map((subCaja) => (
              <Select.Option key={subCaja.id} value={subCaja.id}>
                {subCaja.nombre} - S/ {subCaja.saldo_actual}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {subCajaOrigen && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">
              Saldo disponible: <span className="font-semibold">S/ {subCajaOrigen.saldo_actual}</span>
            </p>
          </div>
        )}

        <Form.Item
          label="Sub-Caja Destino"
          name="sub_caja_destino_id"
          rules={[{ required: true, message: 'Seleccione la sub-caja destino' }]}
        >
          <Select
            placeholder="Seleccione sub-caja destino"
            disabled={!subCajaOrigenId}
            showSearch
            optionFilterProp="children"
          >
            {subCajasDestino.map((subCaja) => (
              <Select.Option key={subCaja.id} value={subCaja.id}>
                {subCaja.nombre} - S/ {subCaja.saldo_actual}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Monto a Transferir"
          name="monto"
          rules={[
            { required: true, message: 'Ingrese el monto' },
            {
              validator: (_, value) => {
                if (!subCajaOrigen) return Promise.resolve()
                const saldoDisponible = parseFloat(subCajaOrigen.saldo_actual)
                if (value > saldoDisponible) {
                  return Promise.reject('El monto excede el saldo disponible')
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <InputNumber
            className="w-full"
            placeholder="0.00"
            min={0.01}
            step={0.01}
            precision={2}
            prefix="S/"
          />
        </Form.Item>

        <Form.Item
          label="Método de Pago (Opcional)"
          name="despliegue_de_pago_id"
          tooltip="Especifica el método de pago utilizado para el movimiento"
        >
          <Select
            placeholder="Seleccione método de pago"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {metodosPago?.map((metodo: any) => (
              <Select.Option key={metodo.id} value={metodo.id}>
                {metodo.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Justificación"
          name="justificacion"
          rules={[{ required: true, message: 'Ingrese una justificación' }]}
        >
          <Input.TextArea
            placeholder="Ej: Depósito en cuenta BCP, Reorganización de efectivo"
            rows={3}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Comprobante (Opcional)"
          name="comprobante"
        >
          <Input
            placeholder="Ej: DEP-001234"
            maxLength={255}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
