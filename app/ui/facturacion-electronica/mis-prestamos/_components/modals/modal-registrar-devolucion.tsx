'use client'

import { Modal, Form, message } from 'antd'
import { useState } from 'react'
import FormBase from '~/components/form/form-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { FaSave } from 'react-icons/fa'
import { Prestamo, prestamoApi } from '~/lib/api/prestamo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs, { Dayjs } from 'dayjs'
import { FaCalendar } from 'react-icons/fa6'

interface ModalRegistrarDevolucionProps {
  open: boolean
  setOpen: (open: boolean) => void
  prestamo?: Prestamo
}

interface FormValues {
  monto: number
  fecha_pago: Dayjs
  observaciones?: string
}

export default function ModalRegistrarDevolucion({
  open,
  setOpen,
  prestamo,
}: ModalRegistrarDevolucionProps) {
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!prestamo) throw new Error('No hay préstamo seleccionado')
      
      const data = {
        monto: values.monto,
        fecha_pago: values.fecha_pago.format('YYYY-MM-DD'),
        metodo_pago: 'Devolución Física', // Valor fijo ya que solo se devuelven productos
        observaciones: values.observaciones,
      }

      return prestamoApi.registrarPago(prestamo.id, data)
    },
    onSuccess: () => {
      message.success('Devolución registrada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS] })
      form.resetFields()
      setOpen(false)
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Error al registrar la devolución')
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(values)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setOpen(false)
  }

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaSave className='text-green-600' />
          <span>Registrar Devolución</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      {prestamo && (
        <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <span className='font-semibold'>N° Préstamo:</span> {prestamo.numero}
            </div>
            <div>
              <span className='font-semibold'>Cliente/Proveedor:</span>{' '}
              {prestamo.cliente?.razon_social ||
                `${prestamo.cliente?.nombres || ''} ${prestamo.cliente?.apellidos || ''}`.trim() ||
                prestamo.proveedor?.razon_social ||
                'N/A'}
            </div>
            <div>
              <span className='font-semibold'>Cantidad Total:</span> {Number(prestamo.monto_total).toFixed(0)}
            </div>
            <div>
              <span className='font-semibold'>Devuelto:</span>{' '}
              <span className='text-green-600 font-bold'>{Number(prestamo.monto_pagado).toFixed(0)}</span>
            </div>
            <div className='col-span-2'>
              <span className='font-semibold'>Pendiente:</span>{' '}
              <span className='text-red-600 font-bold'>{Number(prestamo.monto_pendiente).toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      <FormBase
        form={form}
        name='form-registrar-devolucion'
        onFinish={handleSubmit}
        initialValues={{
          fecha_pago: dayjs(),
          metodo_pago: 'Devolución Física', // Valor por defecto fijo
        }}
      >
        <div className='space-y-4'>
          <LabelBase label='Cantidad a Devolver' orientation='column'>
            <InputBase
              propsForm={{
                name: 'monto',
                rules: [
                  { required: true, message: 'Ingrese la cantidad' },
                  {
                    validator: (_, value) => {
                      if (!prestamo) return Promise.resolve()
                      if (value > prestamo.monto_pendiente) {
                        return Promise.reject('La cantidad excede el pendiente')
                      }
                      if (value <= 0) {
                        return Promise.reject('La cantidad debe ser mayor a 0')
                      }
                      return Promise.resolve()
                    },
                  },
                ],
              }}
              type='number'
              placeholder='Ingrese la cantidad'
              min={0}
              step={1}
            />
          </LabelBase>

          <LabelBase label='Fecha de Devolución' orientation='column'>
            <DatePickerBase
              propsForm={{
                name: 'fecha_pago',
                rules: [{ required: true, message: 'Seleccione la fecha' }],
              }}
              placeholder='Seleccione la fecha'
              prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
            />
          </LabelBase>

          <LabelBase label='Observaciones (Opcional)' orientation='column'>
            <TextareaBase
              propsForm={{
                name: 'observaciones',
            }}
            placeholder='Ingrese observaciones sobre la devolución'
            rows={3}
          />
          </LabelBase>

          <div className='flex gap-2 justify-end pt-4'>
            <ButtonBase color='default' size='md' type='button' onClick={handleCancel}>
              Cancelar
            </ButtonBase>
            <ButtonBase
              color='success'
              size='md'
              type='submit'
              disabled={loading}
              className='flex items-center gap-2'
            >
              <FaSave />
              {loading ? 'Registrando...' : 'Registrar Devolución'}
            </ButtonBase>
          </div>
        </div>
      </FormBase>
    </Modal>
  )
}
