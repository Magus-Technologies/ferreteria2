'use client'

import {
  EstadoDeVenta,
  FormaDePago,
  TipoMoneda,
  TipoDocumento,
} from '@prisma/client'
import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import FormBase from '~/components/form/form-base'
import useCreateVenta from '../../_hooks/use-create-venta'
import useInitVenta from '../../_hooks/use-init-venta'
import { VentaConUnidadDerivadaNormal } from './header-crear-venta'
import FormTableVender from '../form/form-table-vender'

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
    subtotal: number
  }>
  fecha: Dayjs
  forma_de_pago: FormaDePago
  tipo_documento: TipoDocumento
  serie?: string
  numero?: number
  tipo_moneda: TipoMoneda
  tipo_de_cambio?: number
  estado_de_venta?: EstadoDeVenta
  despliegue_de_pago_id?: string
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
        {/* <FormCrearVender form={form} venta={venta} /> */}
      </div>
      {/* <CardsInfoVender form={form} venta={venta} /> */}
    </FormBase>
  )
}
