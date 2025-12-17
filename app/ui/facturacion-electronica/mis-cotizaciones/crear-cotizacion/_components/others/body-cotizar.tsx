'use client'

import {
  TipoMoneda,
  DescuentoTipo,
} from '@prisma/client'
import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import FormBase from '~/components/form/form-base'
import FormTableCotizar from '../form/form-table-cotizar'
import FormCrearCotizacion from '../form/form-crear-cotizacion'
import CardsInfoCotizacion from '../cards/cards-info-cotizacion'

export type FormCreateCotizacion = {
  productos: Array<{
    producto_id: number
    producto_name: string
    producto_codigo: string
    marca_name: string
    unidad_derivada_id: number
    unidad_derivada_name: string
    unidad_derivada_factor: number
    cantidad: number
    precio_venta: number
    recargo?: number
    subtotal: number
    descuento_tipo?: DescuentoTipo
    descuento?: number
  }>
  fecha: Dayjs
  tipo_moneda: TipoMoneda
  tipo_de_cambio?: number
  cliente_id?: number
  observaciones?: string
  vigencia_dias?: number
}

export default function BodyCotizar() {
  const [form] = Form.useForm<FormCreateCotizacion>()

  const handleSubmit = async (values: FormCreateCotizacion) => {
    console.log('Cotización:', values)
    // Aquí irá la lógica para crear la cotización
  }

  return (
    <FormBase<FormCreateCotizacion>
      form={form}
      name='cotizacion'
      className='flex gap-6 size-full'
      onFinish={handleSubmit}
    >
      <div className='flex-1 flex flex-col gap-6'>
        <FormTableCotizar form={form} />
        <FormCrearCotizacion form={form} />
      </div>
      <CardsInfoCotizacion form={form} />
    </FormBase>
  )
}
