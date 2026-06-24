'use client'

import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import FormBase from '~/components/form/form-base'
import useCreateGuia from '../../_hooks/use-create-guia'
import useInitGuia from '../../_hooks/use-init-guia'
import FormTableGuia from '../form/form-table-guia'
import FormCrearGuia from '../form/form-crear-guia'
import CardsInfoGuia from '../cards/cards-info-guia'
import { guiaRemisionApi } from '~/lib/api/guia-remision'

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
    unidad_derivada_venta_id?: number
  }>
  venta_id?: string
  fecha_emision: Dayjs
  fecha_traslado: Dayjs
  afecta_stock: string | boolean // 'true' | 'false' | true | false
  serie?: string
  numero?: number
  destino_id?: number
  cliente_id?: number
  comprador_id?: number
  comprador_nombre?: string
  /**
   * Remitente — solo aplica a `tipo_guia === 'ELECTRONICA_TRANSPORTISTA'`.
   * Es el cliente que CONTRATA el servicio de transporte (dueño de la
   * mercadería). En el backend se mapea a `remitente_id` y luego a
   * Greenter `setTercero` para el XML SUNAT GRE-31.
   */
  remitente_id?: number
  remitente_nombre?: string
  almacen_origen_id?: number
  almacen_destino_id?: number
  referencia?: string
  motivo_traslado: string
  modalidad_transporte: string
  tipo_transporte?: string
  vehiculo_placa?: string
  chofer_id?: number
  /** USER que actúa como chofer en transporte PRIVADO. */
  user_chofer_id?: string
  user_chofer_nombre?: string
  punto_partida: string
  punto_llegada: string
  tipo_guia: string
  validar_modalidad: boolean
  validar_costo: boolean
}

export default function BodyCrearGuia({
  guia: guiaProp,
}: { guia?: any } = {}) {
  const [form] = Form.useForm<FormCreateGuia>()
  const searchParams = useSearchParams()
  const motivoCodigo = searchParams.get('motivo_codigo') || ''
  const guiaId = searchParams.get('guia_id')

  const { data: guiaFetched } = useQuery({
    queryKey: ['guia-remision', guiaId],
    queryFn: async () => {
      const res = await guiaRemisionApi.getById(guiaId!)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? res.data
    },
    enabled: !!guiaId && !guiaProp,
    staleTime: 0,
  })

  const guia = guiaProp ?? guiaFetched

  const { venta } = useInitGuia({ guia, form })

  const { handleSubmit, isCreating } = useCreateGuia(form)

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
        <FormCrearGuia form={form} guia={guia} venta={venta} initialMotivoCodigo={motivoCodigo} />
      </div>
      <div className='w-full xl:w-auto'>
        <CardsInfoGuia form={form} guia={guia} isCreating={isCreating} />
      </div>
    </FormBase>
  )
}
