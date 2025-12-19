'use client'

import {
  TipoMoneda,
  DescuentoTipo,
  FormaDePago,
  TipoDocumento,
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
  // Campos principales
  fecha: Dayjs
  tipo_moneda: TipoMoneda
  tipo_de_cambio?: number
  
  // Campos de vendedor y forma de pago
  vendedor?: string
  forma_de_pago?: FormaDePago
  vigencia_dias?: number
  
  // Campos de cliente
  ruc_dni?: string
  cliente_id?: number
  telefono?: string
  direccion?: string
  
  // Campos de documento
  fecha_vencimiento?: Dayjs
  tipo_documento?: TipoDocumento
  fecha_proforma?: Dayjs
  numero?: string  // Número completo generado automáticamente (COT-2025-001)
  
  // Observaciones
  observaciones?: string
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
