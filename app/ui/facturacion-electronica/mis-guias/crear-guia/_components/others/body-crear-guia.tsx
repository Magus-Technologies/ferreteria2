'use client'

import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import FormBase from '~/components/form/form-base'
import useCreateGuia from '../../_hooks/use-create-guia'
import useInitGuia from '../../_hooks/use-init-guia'
import FormTableGuia from '../form/form-table-guia'
import FormCrearGuia from '../form/form-crear-guia'
import CardsInfoGuia from '../cards/cards-info-guia'

export type FormCreateGuia = {
  productos: Array<{
    producto_id: number
    producto_almacen_id?: number
    producto_name: string
    producto_codigo: string
    marca_name: string
    unidad_derivada_id: number
    unidad_derivada_name: string
    unidad_derivada_factor: number
    cantidad: number
    costo: number
    precio_venta: number
    peso_total?: number
  }>
  venta_id?: string
  fecha_emision: Dayjs
  fecha_traslado: Dayjs
  afecta_stock: string | boolean // 'true' | 'false' | true | false
  serie?: string
  numero?: number
  destino_id?: number
  cliente_id?: number
  referencia?: string
  motivo_traslado: string
  modalidad_transporte: string
  tipo_transporte?: string
  vehiculo_placa?: string
  chofer_id?: number
  punto_partida: string
  punto_llegada: string
  tipo_guia: string
  validar_modalidad: boolean
  validar_costo: boolean
}

export default function BodyCrearGuia({
  guia,
}: { guia?: any } = {}) {
  const [form] = Form.useForm<FormCreateGuia>()

  const { venta } = useInitGuia({ guia, form })

  const { handleSubmit } = useCreateGuia(form)

  return (
    <FormBase<FormCreateGuia>
      form={form}
      name='guia'
      className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full'
      onFinish={handleSubmit}
    >
      <div className='flex-1 flex flex-col gap-4 xl:gap-6 min-w-0 min-h-0'>
        <div className='flex-1 min-h-0'>
          <FormTableGuia form={form} guia={guia} />
        </div>
        <FormCrearGuia form={form} guia={guia} venta={venta} />
      </div>
      <div className='w-full xl:w-auto'>
        <CardsInfoGuia form={form} guia={guia} />
      </div>
    </FormBase>
  )
}
