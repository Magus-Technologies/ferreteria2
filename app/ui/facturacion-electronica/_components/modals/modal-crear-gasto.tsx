'use client'

import { Form, DatePicker, InputNumber, Input, Select, message } from 'antd'
import { useState } from 'react'
import dayjs from 'dayjs'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import SelectCajaPrincipal from '../selects/select-caja-principal'

type ModalCrearGastoProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

interface CrearGastoFormValues {
  fecha: dayjs.Dayjs
  sub_caja_id: number
  monto: number
  concepto: string
  comentario?: string
  afecta_caja: 'si' | 'no'
}

export default function ModalCrearGasto({
  open,
  setOpen,
  onSuccess,
}: ModalCrearGastoProps) {
  const [form] = Form.useForm<CrearGastoFormValues>()
  const [loading, setLoading] = useState(false)
  const [cajaPrincipalId, setCajaPrincipalId] = useState<number | null>(null)

  const handleSubmit = async (values: CrearGastoFormValues) => {
    if (values.afecta_caja === 'no') {
      message.info('Gasto registrado sin afectar caja')
      form.resetFields()
      setOpen(false)
      onSuccess?.()
      return
    }

    setLoading(true)
    try {
      const response = await transaccionesCajaApi.registrarTransaccion({
        sub_caja_id: values.sub_caja_id,
        tipo_transaccion: 'egreso',
        monto: values.monto,
        descripcion: values.concepto,
        referencia_tipo: 'egreso_manual',
      })

      if (response.error) {
        message.error(response.error.message || 'Error al registrar gasto')
        return
      }

      message.success('Gasto registrado exitosamente')
      form.resetFields()
      setCajaPrincipalId(null)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error al registrar gasto:', error)
      message.error('Error inesperado al registrar gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 700,
        title: <TitleForm>Registrar Gastos</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Guardar',
      }}
      onCancel={() => {
        form.resetFields()
        setCajaPrincipalId(null)
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
        initialValues: {
          fecha: dayjs(),
          afecta_caja: 'si',
        },
      }}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <LabelBase label="Fecha" orientation="column">
            <Form.Item
              name="fecha"
              rules={[{ required: true, message: 'Selecciona la fecha' }]}
              className="mb-0"
            >
              <DatePicker
                format="DD/MM/YYYY"
                className="w-full"
                placeholder="Selecciona fecha"
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Saldo Actual S/." orientation="column">
            <Input
              value="0.00"
              disabled
              className="bg-gray-100"
            />
          </LabelBase>
        </div>

        <LabelBase label="Caja Principal" orientation="column">
          <SelectCajaPrincipal
            placeholder="Selecciona la caja"
            propsForm={{
              name: 'caja_principal_id',
              rules: [{ required: true, message: 'Selecciona una caja principal' }],
            }}
            onChange={(value) => setCajaPrincipalId(value as number)}
          />
        </LabelBase>

        <LabelBase label="Egreso S/." orientation="column">
          <Form.Item
            name="monto"
            rules={[
              { required: true, message: 'Ingresa el monto' },
              { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
            ]}
            className="mb-0"
          >
            <InputNumber
              className="w-full"
              placeholder="0.00"
              min={0}
              step={0.01}
              precision={2}
              prefix="S/"
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Concepto (Max 90 caracteres)" orientation="column">
          <Form.Item
            name="concepto"
            rules={[
              { required: true, message: 'Ingresa el concepto' },
              { max: 90, message: 'Máximo 90 caracteres' },
            ]}
            className="mb-0"
          >
            <Input placeholder="Ej: Pago de servicios, Compra de suministros" maxLength={90} />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Comentario (Max 100 caracteres)" orientation="column">
          <Form.Item name="comentario" className="mb-0">
            <Input.TextArea
              placeholder="Comentario adicional (opcional)"
              rows={3}
              maxLength={100}
              showCount
            />
          </Form.Item>
        </LabelBase>

        <LabelBase label="Afecta Caja" orientation="column">
          <Form.Item
            name="afecta_caja"
            rules={[{ required: true, message: 'Selecciona una opción' }]}
            className="mb-0"
          >
            <Select placeholder="Selecciona">
              <Select.Option value="si">Sí</Select.Option>
              <Select.Option value="no">No</Select.Option>
            </Select>
          </Form.Item>
        </LabelBase>

        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-700">
            <strong>Advertencia:</strong> Este gasto se descontará del saldo de la caja.
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            <strong>SOLO PULSE GUARDAR SI SE REGISTRA EL EGRESO DE DINERO</strong>
          </p>
        </div>
      </div>
    </ModalForm>
  )
}
