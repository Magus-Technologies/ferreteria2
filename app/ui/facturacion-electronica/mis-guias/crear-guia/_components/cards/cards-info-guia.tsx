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
  isCreating = false,
}: {
  form: FormInstance
  guia?: any
  isCreating?: boolean
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

  // Calcular Peso Total (suma de peso_total de cada línea)
  const pesoTotal = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) => acc + Number(item?.peso_total ?? 0),
        0
      ),
    [productos]
  )

  return (
    <>
      {/* Móvil/tablet: grid compacto de 3 columnas (stats en una fila,
          checkboxes + botón debajo). Desktop xl: columna lateral de 256px. */}
      <div className='grid grid-cols-3 gap-2 sm:gap-3 w-full xl:flex xl:flex-col xl:gap-4 xl:w-64 xl:max-w-64'>
        <CardInfoGuia title='Total Costo' value={totalCosto} />
        <CardInfoGuia title='Total Venta' value={totalVenta} className='border-cyan-500 border-2' />
        <CardInfoGuia
          title='Peso Total'
          value={pesoTotal}
          prefix=''
          suffix='kg'
          trimDecimales
          valueColor='text-amber-600'
          className='border-amber-500 border-2'
        />

        <div className='col-span-2 xl:col-span-1 flex flex-row xl:flex-col items-center xl:items-start gap-3 xl:gap-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200'>
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

        {/* Ilustración decorativa: solo en la columna lateral de desktop. */}
        <div className='hidden xl:flex items-center justify-center p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg'>
          <TbTruckDelivery size={80} className='text-cyan-600' />
        </div>

        <ButtonBase
          onClick={() => {
            form.submit()
          }}
          loading={isCreating}
          color={guia ? 'info' : 'success'}
          className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
        >
          {guia ? (
            <MdOutlineLocalShipping className='min-w-fit' size={30} />
          ) : (
            <TbTruckDelivery className='min-w-fit' size={30} />
          )}{' '}
          {isCreating
            ? guia ? 'Editando...' : 'Creando...'
            : `${guia ? 'Editar' : 'Crear'} Guía`}
        </ButtonBase>
      </div>
    </>
  )
}
