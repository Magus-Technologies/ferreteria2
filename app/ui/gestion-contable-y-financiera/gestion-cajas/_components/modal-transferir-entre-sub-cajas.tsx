'use client'

import { useState } from 'react'
import { Modal, Form, InputNumber, Select, Input, Button, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SubCaja } from '~/lib/api/caja-principal'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { useCrearMovimientoInterno } from '~/app/ui/facturacion-electronica/gestion-cajas/_hooks/use-crear-movimiento-interno'

interface Props {
  open: boolean
  onClose: () => void
  subCajas: SubCaja[]
  cajaPrincipalId: number
  onSuccess?: () => void
}

export default function ModalTransferirEntreSubCajas({
  open,
  onClose,
  subCajas,
  cajaPrincipalId,
  onSuccess,
}: Props) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { mutate: crearMovimiento, isPending } = useCrearMovimientoInterno()
  const [subCajaOrigenId, setSubCajaOrigenId] = useState<number | null>(null)
  const [openCrearConcepto, setOpenCrearConcepto] = useState(false)
  const [nuevoConcepto, setNuevoConcepto] = useState('')
  const [creandoConcepto, setCreandoConcepto] = useState(false)

  // Catálogo de CONCEPTOS de movimiento (etiquetas de solo nombre,
  // ej. "EFECTIVO A YAPE") — concepto propio, no son métodos de pago
  const { data: conceptos } = useQuery({
    queryKey: ['conceptos-movimiento'],
    queryFn: async () => {
      const response = await transaccionesCajaApi.getConceptosMovimiento()
      return response.data?.data || []
    },
  })

  // Saldos DISPONIBLES para mover: solo dinero de sesiones CERRADAS (lo
  // generado durante la apertura activa recién se puede mover al cerrar caja)
  const { data: saldosDisponibles } = useQuery({
    queryKey: ['saldos-disponibles-movimiento'],
    queryFn: async () => {
      const response = await transaccionesCajaApi.getSaldosDisponiblesMovimiento()
      return response.data?.data || []
    },
    enabled: open,
  })

  const saldoDisponibleDe = (subCaja: SubCaja): number => {
    const s = saldosDisponibles?.find((x) => x.sub_caja_id === subCaja.id)
    return s ? s.saldo_disponible : parseFloat(subCaja.saldo_actual)
  }

  const handleCrearConcepto = async () => {
    const nombre = nuevoConcepto.trim()
    if (!nombre) {
      message.error('Ingresa el nombre del concepto')
      return
    }
    setCreandoConcepto(true)
    try {
      const res = await transaccionesCajaApi.crearConceptoMovimiento(nombre)
      if (res.error) {
        message.error(res.error.message || 'Error al crear el concepto')
        return
      }
      message.success('Concepto creado')
      queryClient.invalidateQueries({ queryKey: ['conceptos-movimiento'] })
      // Dejarlo seleccionado de inmediato en el formulario
      form.setFieldValue('concepto', res.data?.data?.nombre ?? nombre.toUpperCase())
      setNuevoConcepto('')
      setOpenCrearConcepto(false)
    } finally {
      setCreandoConcepto(false)
    }
  }

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
          concepto: values.concepto,
        },
        {
          onSuccess: () => {
            message.success('Movimiento interno realizado exitosamente')
            form.resetFields()
            setSubCajaOrigenId(null)
            onSuccess?.()
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
                {subCaja.nombre} - S/ {saldoDisponibleDe(subCaja).toFixed(2)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {subCajaOrigen && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">
              Disponible para mover (caja cerrada):{' '}
              <span className="font-semibold">S/ {saldoDisponibleDe(subCajaOrigen).toFixed(2)}</span>
              <span className="text-xs text-gray-400 ml-2">
                (saldo total: S/ {subCajaOrigen.saldo_actual} — lo de la sesión abierta se mueve al cerrar caja)
              </span>
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
                {subCaja.nombre} - S/ {saldoDisponibleDe(subCaja).toFixed(2)}
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
                // Solo se puede mover dinero de sesiones CERRADAS
                const saldoDisponible = saldoDisponibleDe(subCajaOrigen)
                if (value > saldoDisponible) {
                  return Promise.reject(`El monto excede el disponible de caja cerrada (S/ ${saldoDisponible.toFixed(2)})`)
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
          label="Concepto del Movimiento (Opcional)"
          tooltip='Etiqueta que describe el movimiento, ej. "EFECTIVO A YAPE"'
        >
          <div className="flex gap-2">
            <Form.Item name="concepto" noStyle>
              <Select
                placeholder="Seleccione un concepto"
                allowClear
                showSearch
                optionFilterProp="children"
                className="flex-1"
              >
                {conceptos?.map((concepto) => (
                  <Select.Option key={concepto.id} value={concepto.nombre}>
                    {concepto.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Button
              icon={<PlusOutlined />}
              title="Agregar concepto"
              onClick={() => setOpenCrearConcepto(true)}
            />
          </div>
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

      {/* Mini-CRUD del catálogo de conceptos: crear sin salir del flujo */}
      <Modal
        title="Agregar Concepto"
        open={openCrearConcepto}
        onOk={handleCrearConcepto}
        onCancel={() => {
          setNuevoConcepto('')
          setOpenCrearConcepto(false)
        }}
        confirmLoading={creandoConcepto}
        okText="Guardar"
        cancelText="Cancelar"
        width={420}
        destroyOnHidden
      >
        <Input
          placeholder='Ej: EFECTIVO A YAPE'
          value={nuevoConcepto}
          onChange={(e) => setNuevoConcepto(e.target.value.toUpperCase())}
          onPressEnter={handleCrearConcepto}
          maxLength={255}
          autoFocus
          className="mt-2"
        />
        <p className="text-xs text-slate-400 mt-2">
          Solo el nombre: es una etiqueta para identificar el movimiento.
        </p>
      </Modal>
    </Modal>
  )
}
