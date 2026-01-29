'use client'

import { Form, Radio, Switch, App } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'
import { useState, useEffect } from 'react'
import { type DespliegueDePago } from '~/lib/api/despliegue-de-pago'
import { apiRequest } from '~/lib/api'

interface ModalEditarMetodoPagoProps {
  open: boolean
  setOpen: (open: boolean) => void
  metodo: DespliegueDePago
  onSuccess?: () => void
}

export default function ModalEditarMetodoPago({
  open,
  setOpen,
  metodo,
  onSuccess,
}: ModalEditarMetodoPagoProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tipoSobrecargo, setTipoSobrecargo] = useState<string>('ninguno')
  const { message } = App.useApp()

  useEffect(() => {
    if (metodo && open) {
      form.setFieldsValue({
        requiere_numero_serie: metodo.requiere_numero_serie,
        tipo_sobrecargo: metodo.tipo_sobrecargo,
        sobrecargo_porcentaje: metodo.sobrecargo_porcentaje,
        adicional: metodo.adicional,
        mostrar: metodo.mostrar,
      })
      setTipoSobrecargo(metodo.tipo_sobrecargo)
    }
  }, [metodo, open, form])

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await apiRequest(`/despliegues-de-pago/${metodo.id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      })

      if (response.error) {
        message.error(response.error.message || 'Error al actualizar método de pago')
        return
      }

      message.success('Método de pago actualizado exitosamente')
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      message.error('Error inesperado al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 700,
        title: <TitleForm>Editar Método de Pago: {metodo.name}</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Guardar Cambios',
      }}
      onCancel={() => {
        form.resetFields()
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
    >
      <div className='mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200'>
        <p className='text-sm text-slate-700'>
          <strong>Método:</strong> {metodo.name}
        </p>
      </div>

      <LabelBase label='¿Requiere Número de Operación?' orientation='column'>
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

      <div className='mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
        <p className='text-sm text-slate-600'>
          <strong>💡 Ejemplos de configuración:</strong>
        </p>
        <ul className='text-xs text-slate-600 mt-2 space-y-1'>
          <li>• <strong>Izipay:</strong> Requiere N° operación ✓, Sobrecargo 4.8%</li>
          <li>• <strong>Yape:</strong> Requiere N° operación ✓, Sin sobrecargo</li>
          <li>• <strong>Efectivo:</strong> No requiere N° operación, Sin sobrecargo</li>
        </ul>
      </div>
    </ModalForm>
  )
}
