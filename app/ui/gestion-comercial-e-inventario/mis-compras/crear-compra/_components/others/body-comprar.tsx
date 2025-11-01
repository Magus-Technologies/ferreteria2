/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import CardsInfoCompra from './cards-info-compra'
import { Form } from 'antd'
import FormTableComprar from '../form/form-table-comprar'
import FormBase from '~/components/form/form-base'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import { useEffect } from 'react'
import {
  EstadoDeCompra,
  FormaDePago,
  Marca,
  Producto,
  ProductoAlmacenUnidadDerivada,
  Proveedor,
  TipoDocumento,
  TipoMoneda,
  UnidadDerivada,
} from '@prisma/client'
import FormCrearCompra from '../form/form-crear-compra'
import { Dayjs } from 'dayjs'
import useCreateCompra from '../../_hooks/use-create-compra'
import { useStoreAlmacen } from '~/store/store-almacen'
import { CompraConUnidadDerivadaNormal } from './header'
import useInitCompra from '../../../editar-compra/[id]/_hooks/use-init-compra'

export interface FormCreateCompra {
  productos: {
    cantidad: number
    unidad_derivada_id: UnidadDerivada['id']
    precio_compra: number
    lote?: string
    vencimiento?: Dayjs
    bonificacion: boolean
    flete?: number
    subtotal: number
    marca_name?: Marca['name']
    producto_name?: Producto['name']
    producto_codigo?: Producto['cod_producto']
    unidad_derivada_name: UnidadDerivada['name']
    unidad_derivada_factor: ProductoAlmacenUnidadDerivada['factor']

    producto_id: Producto['id']
  }[]
  fecha: Dayjs
  tipo_moneda: TipoMoneda
  tipo_de_cambio: number
  proveedor_id?: Proveedor['id']
  tipo_documento: TipoDocumento
  serie: string
  numero: number
  guia?: string
  forma_de_pago: FormaDePago
  numero_dias?: number
  fecha_vencimiento?: Dayjs
  percepcion?: number
  estado_de_compra?: EstadoDeCompra
}

export default function BodyComprar({
  compra,
}: { compra?: CompraConUnidadDerivadaNormal } = {}) {
  const [form] = Form.useForm<FormCreateCompra>()

  useInitCompra({ compra, form })

  const setProductosCompra = useStoreProductoAgregadoCompra(
    store => store.setProductos
  )
  const setProductoAgregadoCompra = useStoreProductoAgregadoCompra(
    store => store.setProductoAgregado
  )

  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const { handleSubmit } = useCreateCompra({ compra })

  useEffect(() => {
    setProductosCompra([])
    setProductoAgregadoCompra(undefined)
    return () => setProductoAgregadoCompra(undefined)
  }, [])

  useEffect(() => {
    if (!compra) form.setFieldValue('productos', [])
  }, [almacen_id])

  return (
    <FormBase
      form={form}
      name='login'
      className='flex gap-6 size-full'
      onFinish={handleSubmit}
    >
      <div className='flex-1 flex flex-col gap-6'>
        <FormTableComprar form={form} compra={compra} />
        <FormCrearCompra form={form} compra={compra} />
      </div>
      <CardsInfoCompra form={form} compra={compra} />
    </FormBase>
  )
}
