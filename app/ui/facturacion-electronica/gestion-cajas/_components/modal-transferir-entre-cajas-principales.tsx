'use client'

import { useState } from 'react'
import { Modal, Form, InputNumber, Select, Input, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { CajaPrincipal, SubCaja } from '~/lib/api/caja-principal'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useCrearPrestamo } from '../_hooks/use-crear-prestamo'

interface Props {
  open: boolean
  onClose: () => void
  cajasPrincipales: CajaPrincipal[]
}

export default function ModalTransferirEntreCajasPrincipales({
  open,
  onClose,
  cajasPrincipales,
}: Props) {
  const [form] = Form.useForm()
  const { mutate: crearPrestamo, isPending } = useCrearPrestamo()
  const [cajaPrincipalOrigenId, setCajaPrincipalOrigenId] = useState<number | null>(null)
  const [cajaPrincipalDestinoId, setCajaPrincipalDestinoId] = useState<number | null>(null)
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

      const cajaPrincipalDestino = cajasPrincipales.find(
        (cp) => cp.id === values.caja_principal_destino_id
      )

      crearPrestamo(
        {
          sub_caja_origen_id: values.sub_caja_origen_id,
          sub_caja_destino_id: values.sub_caja_destino_id,
          monto: values.monto,
          motivo: values.motivo,
          user_recibe_id: cajaPrincipalDestino?.user.id || '',
          despliegue_de_pago_id: values.despliegue_de_pago_id,
        },
        {
          onSuccess: () => {
            message.success('Préstamo realizado exitosamente')
            form.resetFields()
            setCajaPrincipalOrigenId(null)
            setCajaPrincipalDestinoId(null)
            setSubCajaOrigenId(null)
            onClose()
          },
          onError: (error: any) => {
            message.error(error.message || 'Error al realizar el préstamo')
          },
        }
      )
    } catch (error) {
      console.error('Error de validación:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setCajaPrincipalOrigenId(null)
    setCajaPrincipalDestinoId(null)
    setSubCajaOrigenId(null)
    onClose()
  }

  const cajaPrincipalOrigen = cajasPrincipales.find((cp) => cp.id === cajaPrincipalOrigenId)
  const cajasPrincipalesDestino = cajasPrincipales.filter((cp) => cp.id !== cajaPrincipalOrigenId)
  const cajaPrincipalDestino = cajasPrincipales.find((cp) => cp.id === cajaPrincipalDestinoId)

  const subCajasOrigen = cajaPrincipalOrigen?.sub_cajas || []
  const subCajasDestino = cajaPrincipalDestino?.sub_cajas || []
  const subCajaOrigen = subCajasOrigen.find((sc) => sc.id === subCajaOrigenId)

  return (
    <Modal
      title="Préstamo entre Cajas Principales"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Realizar Préstamo"
      cancelText="Cancelar"
      width={700}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="border-r pr-4">
            <h3 className="font-semibold mb-3 text-gray-700">Origen (Presta)</h3>

            <Form.Item
              label="Caja Principal Origen"
              name="caja_principal_origen_id"
              rules={[{ required: true, message: 'Seleccione la caja origen' }]}
            >
              <Select
                placeholder="Seleccione caja"
                onChange={(value) => {
                  setCajaPrincipalOrigenId(value)
                  form.setFieldValue('sub_caja_origen_id', undefined)
                  setSubCajaOrigenId(null)
                }}
                showSearch
                optionFilterProp="children"
              >
                {cajasPrincipales.map((caja) => (
                  <Select.Option key={caja.id} value={caja.id}>
                    {caja.nombre} ({caja.user.name})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Sub-Caja Origen"
              name="sub_caja_origen_id"
              rules={[{ required: true, message: 'Seleccione la sub-caja' }]}
            >
              <Select
                placeholder="Seleccione sub-caja"
                disabled={!cajaPrincipalOrigenId}
                onChange={(value) => setSubCajaOrigenId(value)}
                showSearch
                optionFilterProp="children"
              >
                {subCajasOrigen.map((subCaja) => (
                  <Select.Option key={subCaja.id} value={subCaja.id}>
                    {subCaja.nombre} - S/ {subCaja.saldo_actual}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {subCajaOrigen && (
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">
                  Saldo: <span className="font-semibold">S/ {subCajaOrigen.saldo_actual}</span>
                </p>
              </div>
            )}
          </div>

          <div className="pl-4">
            <h3 className="font-semibold mb-3 text-gray-700">Destino (Recibe)</h3>

            <Form.Item
              label="Caja Principal Destino"
              name="caja_principal_destino_id"
              rules={[{ required: true, message: 'Seleccione la caja destino' }]}
            >
              <Select
                placeholder="Seleccione caja"
                disabled={!cajaPrincipalOrigenId}
                onChange={(value) => {
                  setCajaPrincipalDestinoId(value)
                  form.setFieldValue('sub_caja_destino_id', undefined)
                }}
                showSearch
                optionFilterProp="children"
              >
                {cajasPrincipalesDestino.map((caja) => (
                  <Select.Option key={caja.id} value={caja.id}>
                    {caja.nombre} ({caja.user.name})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Sub-Caja Destino"
              name="sub_caja_destino_id"
              rules={[{ required: true, message: 'Seleccione la sub-caja' }]}
            >
              <Select
                placeholder="Seleccione sub-caja"
                disabled={!cajaPrincipalDestinoId}
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
          </div>
        </div>

        <Form.Item
          label="Monto del Préstamo"
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
          tooltip="Especifica el método de pago utilizado para el préstamo"
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
          label="Motivo del Préstamo"
          name="motivo"
          rules={[{ required: true, message: 'Ingrese el motivo' }]}
        >
          <Input.TextArea
            placeholder="Ej: Préstamo para dar vueltos"
            rows={3}
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
