'use client'

import { Form, Radio, Switch, App } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'
import { useState } from 'react'
import { apiRequest } from '~/lib/api'

interface ModalCrearMetodoPagoProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

export default function ModalCrearMetodoPago({
  open,
  setOpen,
  onSuccess,
}: ModalCrearMetodoPagoProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tipoSobrecargo, setTipoSobrecargo] = useState<string>('ninguno')
  const { message } = App.useApp()

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await apiRequest('/despliegues-de-pago', {
        method: 'POST',
        body: JSON.stringify(values),
      })

      if (response.error) {
        message.error(response.error.message || 'Error al crear método de pago')
        return
      }

      message.success('Método de pago creado exitosamente')
      setOpen(false)
      form.resetFields()
      setTipoSobrecargo('ninguno')
      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      message.error('Error inesperado al crear')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 700,
        title: <TitleForm>Crear Método de Pago</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Crear Método',
      }}
      onCancel={() => {
        form.resetFields()
        setTipoSobrecargo('ninguno')
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
        initialValues: {
          requiere_numero_serie: false,
          tipo_sobrecargo: 'ninguno',
          sobrecargo_porcentaje: 0,
          adicional: 0,
          mostrar: true,
        },
      }}
    >
      <LabelBase label='Nombre del Método de Pago' orientation='column'>
        <InputBase
          placeholder='Ej: BCP Yape, Izipay, BBVA Transferencia'
          uppercase={false}
          propsForm={{
            name: 'name',
            rules: [
              { required: true, message: 'Ingresa el nombre del método' },
              { max: 191, message: 'Máximo 191 caracteres' },
            ],
          }}
        />
      </LabelBase>

      <LabelBase label='¿Requiere Número de Operación?' className='mt-4' orientation='column'>
        <Form.Item
          name='requiere_numero_serie'
          valuePropName='checked'
          noStyle
        >
          <Switch
            checkedChildren="Sí"
            unCheckedChildren="No"
          />
        </Form.Item>
        <p className='text-xs text-slate-500 mt-1'>
          Si está activado, al usar este método en una venta se pedirá el número de operación/voucher/código de transacción.
          <br />
          <strong>Ejemplo:</strong> Yape, transferencias bancarias, Izipay requieren número. Efectivo no requiere.
        </p>
      </LabelBase>

      <LabelBase label='Tipo de Sobrecargo' className='mt-4' orientation='column'>
        <Form.Item
          name='tipo_sobrecargo'
          rules={[{ required: true, message: 'Selecciona el tipo de sobrecargo' }]}
        >
          <Radio.Group onChange={(e) => setTipoSobrecargo(e.target.value)}>
            <Radio value='ninguno'>Ninguno</Radio>
            <Radio value='porcentaje'>Porcentaje</Radio>
            <Radio value='monto_fijo'>Monto Fijo</Radio>
          </Radio.Group>
        </Form.Item>
      </LabelBase>

      {tipoSobrecargo === 'porcentaje' && (
        <LabelBase label='Porcentaje de Sobrecargo (%)' className='mt-4'>
          <InputNumberBase
            placeholder='Ej: 4.8 para 4.8%'
            min={0}
            max={100}
            precision={2}
            propsForm={{
              name: 'sobrecargo_porcentaje',
              rules: [
                { required: true, message: 'Ingresa el porcentaje' },
                { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              ],
            }}
          />
          <p className='text-xs text-slate-500 mt-1'>
            Ejemplo: Si ingresas 4.8, se cobrará un 4.8% adicional sobre el monto.
          </p>
        </LabelBase>
      )}

      {tipoSobrecargo === 'monto_fijo' && (
        <LabelBase label='Monto Fijo de Sobrecargo (S/.)' className='mt-4'>
          <InputNumberBase
            placeholder='Ej: 5.00'
            min={0}
            precision={2}
            prefix='S/. '
            propsForm={{
              name: 'adicional',
              rules: [
                { required: true, message: 'Ingresa el monto fijo' },
                { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' },
              ],
            }}
          />
          <p className='text-xs text-slate-500 mt-1'>
            Se cobrará este monto fijo adicional en cada transacción.
          </p>
        </LabelBase>
      )}

      <LabelBase label='Mostrar en Ventas' className='mt-4' orientation='column'>
        <Form.Item
          name='mostrar'
          valuePropName='checked'
          noStyle
        >
          <Switch
            checkedChildren="Visible"
            unCheckedChildren="Oculto"
          />
        </Form.Item>
        <p className='text-xs text-slate-500 mt-1'>
          Si está desactivado, este método no aparecerá en las opciones de pago.
        </p>
      </LabelBase>
    </ModalForm>
  )
}
