'use client'

import { Form, FormInstance } from 'antd'
import { useMemo } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FormCreateGuia } from '../others/body-crear-guia'
import CardInfoGuia from './card-info-guia'
import { TbTruckDelivery } from 'react-icons/tb'
import { MdOutlineLocalShipping } from 'react-icons/md'
import CheckboxBase from '~/app/_components/form/checkbox/checkbox-base'

export default function CardsInfoGuia({
  form,
  guia,
}: {
  form: FormInstance
  guia?: any
}) {
  const productos = Form.useWatch(
    'productos',
    form
  ) as FormCreateGuia['productos']

  // Calcular Total Costo
  const totalCosto = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc + Number(item?.costo ?? 0) * Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  )

  // Calcular Total Venta
  const totalVenta = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc + Number(item?.precio_venta ?? 0) * Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  )

  return (
    <>
      <div className='flex flex-col gap-4 max-w-64'>
        <CardInfoGuia title='Total Costo' value={totalCosto} />
        <CardInfoGuia title='Total Venta' value={totalVenta} className='border-cyan-500 border-2' />
        
        <div className='flex flex-col gap-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200'>
          <CheckboxBase
            propsForm={{
              name: 'validar_modalidad',
              valuePropName: 'checked',
            }}
          >
            <span className='text-sm'>Validar Modalidad</span>
          </CheckboxBase>
          <CheckboxBase
            propsForm={{
              name: 'validar_costo',
              valuePropName: 'checked',
            }}
          >
            <span className='text-sm'>Validar P. Costo</span>
          </CheckboxBase>
        </div>

        <div className='flex items-center justify-center p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg'>
          <TbTruckDelivery size={80} className='text-cyan-600' />
        </div>

        <ButtonBase
          onClick={() => {
            form.submit()
          }}
          color={guia ? 'info' : 'success'}
          className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
        >
          {guia ? (
            <MdOutlineLocalShipping className='min-w-fit' size={30} />
          ) : (
            <TbTruckDelivery className='min-w-fit' size={30} />
          )}{' '}
          {guia ? 'Editar' : 'Crear'} Guía
        </ButtonBase>
      </div>
    </>
  )
}
