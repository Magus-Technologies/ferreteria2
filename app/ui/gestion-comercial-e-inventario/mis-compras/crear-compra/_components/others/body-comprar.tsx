/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import CardsInfoCompra from './cards-info-compra'
import { Form } from 'antd'
import FormTableComprar from '../form/form-table-comprar'
import FormBase from '~/components/form/form-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import { useEffect, useState } from 'react'
import ModalAperturarCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-aperturar-caja'
import { useCheckAperturaDiaria } from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_hooks/use-check-apertura-diaria'
import {
  EstadoDeCompra,
  FormaDePago,
  TipoDocumento,
  TipoMoneda,
  type Marca,
  type Producto,
  type Proveedor,
  type UnidadDerivada,
} from '~/types'
import FormCrearCompra from '../form/form-crear-compra'
import { Dayjs } from 'dayjs'
import useCreateCompra from '../../_hooks/use-create-compra'
import { useStoreAlmacen } from '~/store/store-almacen'
import { CompraConUnidadDerivadaNormal } from './header'
import useInitCompra from '../../../editar-compra/[id]/_hooks/use-init-compra'
import { ordenCompraApi } from '~/lib/api/orden-compra'
import dayjs from 'dayjs'

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
    unidad_derivada_factor: number

    producto_id: Producto['id']
  }[]
  fecha: Dayjs
  tipo_moneda: TipoMoneda
  tipo_de_cambio: number
  proveedor_id?: Proveedor['id']
  proveedor_razon_social?: string
  proveedor_ruc?: string
  tipo_documento: TipoDocumento
  serie?: string
  numero?: number
  descripcion?: string
  guia?: string
  forma_de_pago: FormaDePago
  numero_dias?: number
  fecha_vencimiento?: Dayjs
  percepcion?: number
  estado_de_compra?: EstadoDeCompra
  egreso_dinero_id?: string
  despliegue_de_pago_id?: number
  metodo_de_pago_id?: string
  orden_compra_id?: number
}

export default function BodyComprar({
  compra,
  ordenCompraId,
}: { compra?: CompraConUnidadDerivadaNormal; ordenCompraId?: number } = {}) {
  const [form] = Form.useForm<FormCreateCompra>()
  const [openAperturaModal, setOpenAperturaModal] = useState(false)

  const { hasApertura, refetchApertura } = useCheckAperturaDiaria()

  useEffect(() => {
    if (!hasApertura) {
      setOpenAperturaModal(true)
    }
  }, [hasApertura])

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
    if (!ordenCompraId) return
    ordenCompraApi.getById(ordenCompraId).then(res => {
      const orden = res.data?.data
      if (!orden) return
      const productos = (orden.productos ?? []).map(p => ({
        producto_id: p.producto_id,
        producto_name: p.nombre ?? '',
        producto_codigo: p.codigo ?? '',
        marca_name: p.marca ?? '',
        unidad_derivada_id: 0,
        unidad_derivada_name: p.unidad ?? 'UND',
        unidad_derivada_factor: 1,
        cantidad: p.cantidad,
        precio_compra: p.precio,
        flete: p.flete,
        vencimiento: p.vencimiento ? dayjs(p.vencimiento) as unknown as Dayjs : undefined,
        lote: p.lote ?? '',
        bonificacion: false,
        subtotal: p.subtotal,
      }))
      form.setFieldsValue({
        fecha: dayjs(orden.fecha) as unknown as Dayjs,
        orden_compra_id: orden.id,
        proveedor_id: orden.proveedor_id ?? undefined,
        proveedor_ruc: orden.proveedor?.ruc ?? '',
        proveedor_razon_social: orden.proveedor?.razon_social ?? '',
        tipo_moneda: orden.tipo_moneda === 'd' ? TipoMoneda.d : TipoMoneda.Soles,
        tipo_de_cambio: orden.tipo_de_cambio,
        forma_de_pago: orden.forma_de_pago === 'co' ? FormaDePago.Contado : FormaDePago.cr,
        numero_dias: orden.numero_dias ?? undefined,
        fecha_vencimiento: orden.fecha_vencimiento ? dayjs(orden.fecha_vencimiento) as unknown as Dayjs : undefined,
        tipo_documento: TipoDocumento.Factura,
        productos,
        estado_de_compra: EstadoDeCompra.Creado,
      })
      
      // Auto-submit después de cargar los datos - aumentar timeout para asegurar que los valores se propaguen
      setTimeout(() => {
        form.submit()
      }, 1500)
    })
  }, [ordenCompraId])

  useEffect(() => {
    if (!compra) form.setFieldValue('productos', [])
  }, [almacen_id])

  return (
    <>
      <FormBase
        form={form}
        name='compra'
        className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full'
        onFinish={handleSubmit}
      >
        <div className='flex-1 flex flex-col gap-2 xl:gap-3 min-w-0 min-h-0'>
          <ConfigurableElement componentId='gestion-comercial.crear-compra.tabla-productos' label='Tabla de Productos'>
            <div className='flex-1 min-h-0'>
              <FormTableComprar form={form} compra={compra} />
            </div>
          </ConfigurableElement>
          <FormCrearCompra form={form} compra={compra} />
        </div>
        <div className='w-full xl:w-auto'>
          <CardsInfoCompra form={form} compra={compra} />
        </div>
      </FormBase>

      <ModalAperturarCaja
        open={openAperturaModal}
        setOpen={setOpenAperturaModal}
        onSuccess={async () => {
          setOpenAperturaModal(false)
          await refetchApertura()
        }}
      />
    </>
  )
}
