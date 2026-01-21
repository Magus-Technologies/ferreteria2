'use client'

import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import dayjs from 'dayjs'
import ConteoDinero, { type ConteoBilletesMonedas } from '../others/conteo-dinero'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'
import { useState, useCallback } from 'react'
import SelectCajaPrincipal from '~/app/ui/facturacion-electronica/_components/selects/select-caja-principal'
import useAperturarCaja from '../../_hooks/use-aperturar-caja'

type ModalAperturarCajaProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

export interface AperturarCajaFormValues {
  caja_principal_id: number
  monto_apertura: number
  conteo_billetes_monedas?: ConteoBilletesMonedas
}

export default function ModalAperturarCaja({
  open,
  setOpen,
  onSuccess,
}: ModalAperturarCajaProps) {
  const [form] = Form.useForm<AperturarCajaFormValues>()
  const [conteoTotal, setConteoTotal] = useState(0)
  const [conteoDetallado, setConteoDetallado] = useState<ConteoBilletesMonedas | undefined>()

  const { crearAperturarCaja, loading } = useAperturarCaja({
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
      setConteoTotal(0)
      setConteoDetallado(undefined)
      onSuccess?.()
    },
  })

  const handleConteoChange = useCallback((value: number) => {
    setConteoTotal(value)
    form.setFieldValue('monto_apertura', value)
  }, [form])

  const handleConteoDetalladoChange = useCallback((conteo: ConteoBilletesMonedas) => {
    setConteoDetallado(conteo)
    form.setFieldValue('conteo_billetes_monedas', conteo)
  }, [form])

  return (
    <ModalForm
      modalProps={{
        width: 900,
        title: <TitleForm>Agregar Efectivo a Caja</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Agregar Efectivo',
      }}
      onCancel={() => {
        form.resetFields()
        setConteoTotal(0)
        setConteoDetallado(undefined)
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearAperturarCaja,
        layout: 'vertical',
        initialValues: {
          monto_apertura: 0,
        },
      }}
    >
      <div className='grid grid-cols-2 gap-6'>
        {/* Columna Izquierda - Información */}
        <div>
          <div className='flex items-center gap-2 mb-4'>
            <div className='font-bold text-slate-500'>Fecha Actual:</div>
            <div className='font-semibold text-lg'>{dayjs().format('DD/MM/YYYY')}</div>
          </div>

          <LabelBase label='Seleccionar Caja Principal' orientation='column'>
            <SelectCajaPrincipal
              placeholder='Selecciona la caja'
              propsForm={{
                name: 'caja_principal_id',
                rules: [{ required: true, message: 'Selecciona una caja principal' }],
              }}
            />
          </LabelBase>

          <div className='mt-6 p-4 bg-green-50 rounded-lg border border-green-200'>
            <p className='text-sm text-slate-700 mb-2'>
              <strong>💰 Agregar Efectivo:</strong> El monto se agregará a la <strong>Caja Chica</strong>.
            </p>
            <p className='text-xs text-slate-600'>
              Si la caja no está aperturada, se aperturará automáticamente.
            </p>
            <p className='text-xs text-slate-600'>
              Si ya está aperturada, se sumará al saldo actual.
            </p>
          </div>

          <LabelBase 
            label='MONTO A AGREGAR S/.' 
            className='mt-6 items-center'
            classNames={{ label: 'whitespace-nowrap' }}
          >
            <InputNumberBase
              size='large'
              className='w-full'
              placeholder='0.00'
              propsForm={{
                name: 'monto_apertura',
                rules: [
                  {
                    required: true,
                    message: 'Ingresa el monto a agregar',
                  },
                  {
                    type: 'number',
                    min: 0,
                    message: 'El monto debe ser mayor o igual a 0',
                  },
                ],
              }}
            />
          </LabelBase>

          <div className='mt-4 p-3 bg-yellow-50 rounded border border-yellow-200'>
            <div className='text-center'>
              <div className='text-sm text-slate-600'>Monto a Agregar</div>
              <div className='text-3xl font-bold text-emerald-600'>
                S/. {form.getFieldValue('monto_apertura')?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Conteo de Dinero */}
        <div>
          <div className='text-sm font-semibold text-slate-600 mb-2'>
            Conteo de Efectivo (Opcional)
          </div>
          <ConteoDinero
            className='mx-auto'
            onChange={handleConteoChange}
            onConteoChange={handleConteoDetalladoChange}
          />
        </div>
      </div>
    </ModalForm>
  )
}
