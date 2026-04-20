'use client'

import { Form, App } from 'antd'
import { useEffect } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import { ComisionVendedor } from '~/lib/api/comision'
import { useRegistrarPagoComision } from '../../_hooks/use-comisiones'
import { useStoreFiltrosComisiones } from '../../_store/store-filtros-comisiones'

interface Props {
  vendedor: ComisionVendedor | null
  open: boolean
  onClose: () => void
}

interface Values {
  monto_pagado: number
  periodo_desde: Dayjs
  periodo_hasta: Dayjs
  fecha_pago: Dayjs
  metodo_pago?: string
  observacion?: string
}

const METODO_PAGO_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'otro', label: 'Otro' },
]

function formatPEN(n: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(n)
}

export default function ModalRegistrarPago({ vendedor, open, onClose }: Props) {
  const [form] = Form.useForm<Values>()
  const { message } = App.useApp()
  const filtros = useStoreFiltrosComisiones(s => s.filtros)
  const { mutate, isPending } = useRegistrarPagoComision()

  useEffect(() => {
    if (open && vendedor) {
      form.resetFields()
      form.setFieldsValue({
        monto_pagado: Number(vendedor.comision_pendiente) || 0,
        periodo_desde: dayjs(filtros.desde),
        periodo_hasta: dayjs(filtros.hasta),
        fecha_pago: dayjs(),
      })
    }
  }, [open, vendedor, form, filtros.desde, filtros.hasta])

  const onFinish = (values: Values) => {
    if (!vendedor) return

    const monto = Number(values.monto_pagado)
    if (monto > vendedor.comision_pendiente + 0.01) {
      message.error(
        `El monto excede el pendiente (${formatPEN(vendedor.comision_pendiente)})`
      )
      return
    }

    mutate(
      {
        user_id: vendedor.user_id,
        monto_pagado: monto,
        periodo_desde: values.periodo_desde.format('YYYY-MM-DD'),
        periodo_hasta: values.periodo_hasta.format('YYYY-MM-DD'),
        fecha_pago: values.fecha_pago.format('YYYY-MM-DD'),
        metodo_pago: values.metodo_pago,
        observacion: values.observacion,
      },
      {
        onSuccess: () => {
          message.success('Pago registrado correctamente')
          onClose()
        },
        onError: err =>
          message.error(err instanceof Error ? err.message : 'Error al registrar el pago'),
      }
    )
  }

  return (
    <ModalForm
      open={open}
      setOpen={(v) => !v && onClose()}
      onCancel={onClose}
      modalProps={{
        title: <TitleForm className='!pb-0'>Registrar Pago de Comisión</TitleForm>,
        className: 'min-w-[550px]',
        centered: true,
        okText: 'Registrar Pago',
        okButtonProps: { loading: isPending, disabled: isPending },
      }}
      formProps={{ form, onFinish }}
    >
      {vendedor && (
        <div className='bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4'>
          <div className='text-sm text-gray-600'>Vendedor</div>
          <div className='font-semibold'>{vendedor.vendedor}</div>
          <div className='flex gap-4 mt-2 text-sm'>
            <span>
              Generado: <b>{formatPEN(vendedor.comision_generada)}</b>
            </span>
            <span className='text-green-700'>
              Pagado: <b>{formatPEN(vendedor.comision_pagada)}</b>
            </span>
            <span className='text-orange-700'>
              Pendiente: <b>{formatPEN(vendedor.comision_pendiente)}</b>
            </span>
          </div>
        </div>
      )}

      <Form.Item
        name='monto_pagado'
        label='Monto a pagar'
        rules={[
          { required: true, message: 'Ingrese el monto' },
          { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
        ]}
      >
        <InputNumberBase min={0.01} step={0.01} className='w-full' prefix='S/' />
      </Form.Item>

      <div className='grid grid-cols-2 gap-3'>
        <Form.Item
          name='periodo_desde'
          label='Periodo desde'
          rules={[{ required: true, message: 'Seleccione la fecha' }]}
        >
          <DatePickerBase className='w-full' />
        </Form.Item>
        <Form.Item
          name='periodo_hasta'
          label='Periodo hasta'
          rules={[{ required: true, message: 'Seleccione la fecha' }]}
        >
          <DatePickerBase className='w-full' />
        </Form.Item>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <Form.Item
          name='fecha_pago'
          label='Fecha de pago'
          rules={[{ required: true, message: 'Seleccione la fecha' }]}
        >
          <DatePickerBase className='w-full' />
        </Form.Item>
        <Form.Item name='metodo_pago' label='Método de pago'>
          <SelectBase options={METODO_PAGO_OPTIONS} placeholder='Seleccionar' allowClear />
        </Form.Item>
      </div>

      <Form.Item name='observacion' label='Observación'>
        <TextareaBase rows={3} placeholder='Notas adicionales (opcional)' />
      </Form.Item>
    </ModalForm>
  )
}
