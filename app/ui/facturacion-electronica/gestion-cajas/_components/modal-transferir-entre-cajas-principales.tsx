'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Select, Input, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { CajaPrincipal, SubCaja } from '~/lib/api/caja-principal'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useCrearPrestamo } from '../_hooks/use-crear-prestamo'
import { useAuth } from '~/lib/auth-context'

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
  const { user } = useAuth()
  const { mutate: crearPrestamo, isPending } = useCrearPrestamo()
  const [cajaPrincipalOrigenId, setCajaPrincipalOrigenId] = useState<number | null>(null)

  // Usar userId del usuario autenticado
  const currentUserId = user?.id

  // Obtener la caja del usuario actual
  const miCajaPrincipal = cajasPrincipales.find((cp) => cp.user.id === currentUserId)
  
  // Filtrar cajas de otros usuarios para "De quién solicito"
  const cajasPrincipalesOtros = cajasPrincipales.filter((cp) => cp.user.id !== currentUserId)

  // Auto-seleccionar la caja del usuario al abrir el modal
  useEffect(() => {
    if (open && miCajaPrincipal) {
      form.setFieldValue('caja_principal_destino_id', miCajaPrincipal.id)
    }
  }, [open, miCajaPrincipal, form])

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

      crearPrestamo(
        {
          caja_principal_origen_id: values.caja_principal_origen_id, // Solo caja principal
          sub_caja_destino_id: values.sub_caja_destino_id,
          monto: values.monto,
          motivo: values.motivo,
          user_recibe_id: currentUserId || '',
          despliegue_de_pago_id: values.despliegue_de_pago_id,
        },
        {
          onSuccess: () => {
            message.success('Solicitud de préstamo enviada exitosamente')
            form.resetFields()
            setCajaPrincipalOrigenId(null)
            onClose()
          },
          onError: (error: any) => {
            message.error(error.message || 'Error al solicitar el préstamo')
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
    onClose()
  }

  const cajaPrincipalOrigen = cajasPrincipales.find((cp) => cp.id === cajaPrincipalOrigenId)
  const subCajasDestino = miCajaPrincipal?.sub_cajas || []

  return (
    <Modal
      title="Solicitar Préstamo entre Cajas"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Solicitar Préstamo"
      cancelText="Cancelar"
      width={700}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-800">📥 Mi Caja (Destino)</h3>
          <p className="text-sm text-gray-600 mb-3">
            El dinero llegará a la sub-caja que selecciones
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Caja Principal"
              name="caja_principal_destino_id"
              className="mb-0"
            >
              <Select
                placeholder="Tu caja"
                disabled
                value={miCajaPrincipal?.id}
              >
                {miCajaPrincipal ? (
                  <Select.Option value={miCajaPrincipal.id}>
                    {miCajaPrincipal.nombre} ({miCajaPrincipal.user.name})
                  </Select.Option>
                ) : (
                  <Select.Option value={0} disabled>
                    ⚠️ No se encontró tu caja
                  </Select.Option>
                )}
              </Select>
            </Form.Item>

            <Form.Item
              label="Sub-Caja Destino"
              name="sub_caja_destino_id"
              rules={[{ required: true, message: 'Seleccione tu sub-caja' }]}
              className="mb-0"
            >
              <Select
                placeholder="Seleccione tu sub-caja"
                showSearch
                optionFilterProp="children"
                disabled={!miCajaPrincipal || subCajasDestino.length === 0}
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

        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h3 className="font-semibold mb-2 text-emerald-800">📤 De quién solicito (Origen)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Selecciona al vendedor de quien quieres solicitar el préstamo. Él decidirá de qué sub-caja prestarte.
          </p>

          <Form.Item
            label="Caja Principal del Vendedor"
            name="caja_principal_origen_id"
            rules={[{ required: true, message: 'Seleccione la caja del vendedor' }]}
          >
            <Select
              placeholder="Seleccione vendedor"
              onChange={(value) => setCajaPrincipalOrigenId(value)}
              showSearch
              optionFilterProp="children"
            >
              {cajasPrincipalesOtros.map((caja) => (
                <Select.Option key={caja.id} value={caja.id}>
                  {caja.nombre} - {caja.user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {cajaPrincipalOrigen && (
            <div className="mt-3 p-3 bg-white rounded border border-emerald-300">
              <p className="text-sm text-gray-700">
                <strong>Vendedor:</strong> {cajaPrincipalOrigen.user.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                El vendedor seleccionará de qué sub-caja prestarte al aprobar tu solicitud
              </p>
            </div>
          )}
        </div>

        <Form.Item
          label="Monto del Préstamo"
          name="monto"
          rules={[{ required: true, message: 'Ingrese el monto' }]}
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
          label="Método de Pago"
          name="despliegue_de_pago_id"
          tooltip="Especifica el método de pago. Por defecto es efectivo."
          initialValue={metodosPago?.find((m: any) => m.name.toLowerCase().includes('efectivo'))?.id}
        >
          <Select
            placeholder="Seleccione método de pago"
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
