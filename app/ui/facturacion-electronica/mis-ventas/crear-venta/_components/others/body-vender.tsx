'use client'

import {
  EstadoDeVenta,
  FormaDePago,
  TipoMoneda,
  TipoDocumento,
  DescuentoTipo,
} from '@prisma/client'
import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import FormBase from '~/components/form/form-base'
import useCreateVenta from '../../_hooks/use-create-venta'
import useInitVenta from '../../_hooks/use-init-venta'
import { VentaConUnidadDerivadaNormal } from './header-crear-venta'
import FormTableVender from '../form/form-table-vender'
import FormCrearVenta from '../form/form-crear-venta'
import CardsInfoVenta from '../cards/cards-info-venta'

export type FormCreateVenta = {
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
    comision?: number
  }>
  fecha: Dayjs
  forma_de_pago: FormaDePago
  tipo_documento: TipoDocumento
  tipo_moneda: TipoMoneda
  tipo_de_cambio?: number
  estado_de_venta?: EstadoDeVenta
  despliegue_de_pago_id?: string
  cliente_id?: number
  recomendado_por_id?: number
  metodos_de_pago?: Array<{
    despliegue_de_pago_id: string
    monto: number
  }>
}

export default function BodyVender({
  venta,
}: { venta?: VentaConUnidadDerivadaNormal } = {}) {
  const [form] = Form.useForm<FormCreateVenta>()

  useInitVenta({ venta, form })

  const { handleSubmit } = useCreateVenta()

  return (
    <FormBase<FormCreateVenta>
      form={form}
      name='venta'
      className='flex gap-6 size-full'
      onFinish={handleSubmit}
    >
      <div className='flex-1 flex flex-col gap-6'>
        <FormTableVender form={form} venta={venta} />
        <FormCrearVenta form={form} venta={venta} />
      </div>
      <CardsInfoVenta form={form} />
    </FormBase>
  )
}
