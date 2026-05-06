/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import CardsInfoCompra from './cards-info-compra'
import { Form } from 'antd'
import FormTableComprar from '../form/form-table-comprar'
import FormBase from '~/components/form/form-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import { useEffect, useState } from 'react'
import { useCheckAperturaDiaria } from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_hooks/use-check-apertura-diaria'
import AperturaGuard from '~/app/ui/_components/apertura-auto-check'
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
import { useUltimaCalificacionProveedor } from '../../_hooks/use-ultima-calificacion-proveedor'
import FloatingCalificacionProveedor from '../alerts/floating-calificacion-proveedor'
import ModalEditarPreciosProducto from '~/app/_components/modals/modal-editar-precios-producto'

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
    nuevo_precio_publico?: number
    nuevo_precio_especial?: number
    nuevo_precio_minimo?: number
    nuevo_precio_ultimo?: number
    costo_actual?: number
  }[]
  fecha: Dayjs
  tipo_moneda: TipoMoneda
  tipo_de_cambio: number
  proveedor_id?: Proveedor['id']
  proveedor_razon_social?: string
  proveedor_ruc?: string
  tipo_documento: TipoDocumento
  serie?: string
  numero?: string
  descripcion?: string
  guia?: string
  forma_de_pago: FormaDePago
  numero_dias?: number
  fecha_vencimiento?: Dayjs
  percepcion?: number
  estado_de_compra?: EstadoDeCompra
  egreso_dinero_id?: string
  gasto_extra_id?: string
  despliegue_de_pago_id?: number
  metodo_de_pago_id?: string
  orden_compra_id?: number
  metodos_de_pago?: Array<{
    despliegue_de_pago_id: string
    monto: number
    numero_operacion?: string
  }>
}

export default function BodyComprar({
  compra,
  ordenCompraId,
  isRecuperacion = false,
}: { compra?: CompraConUnidadDerivadaNormal; ordenCompraId?: number; isRecuperacion?: boolean } = {}) {
  const [form] = Form.useForm<FormCreateCompra>()
  useCheckAperturaDiaria()

  useInitCompra({ compra, form })

  const setProductosCompra = useStoreProductoAgregadoCompra(
    store => store.setProductos
  )
  const setProductoAgregadoCompra = useStoreProductoAgregadoCompra(
    store => store.setProductoAgregado
  )

  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const { handleSubmit, loading } = useCreateCompra({ compra, form, isRecuperacion: isRecuperacion || !!ordenCompraId })

  const [proveedorDefault, setProveedorDefault] = useState<{ id: number; ruc: string; razon_social: string }[]>([])
  const [proveedorRucInicial, setProveedorRucInicial] = useState('')
  const [proveedorId, setProveedorId] = useState<number | undefined>(undefined)

  // Estado para el modal de editar precios
  const [modalEditarPreciosOpen, setModalEditarPreciosOpen] = useState(false)
  const [detallePrecioSeleccionado, setDetallePrecioSeleccionado] = useState<any>(null)

  // Hook para obtener la última calificación del proveedor
  const { data: calificacionResponse, isLoading: loadingCalificacion } = useUltimaCalificacionProveedor(proveedorId)

  useEffect(() => {
    setProductosCompra([])
    setProductoAgregadoCompra(undefined)
    return () => setProductoAgregadoCompra(undefined)
  }, [])

  // Listener para abrir el modal de editar precios
  useEffect(() => {
    const handleOpenModal = async (event: Event) => {
      const customEvent = event as CustomEvent<{ 
        productoId: number
        unidadDerivadaId: number
        costoActual: number
        productoNombre: string
        unidadNombre: string
        factor: number
      }>
      const { productoId, unidadDerivadaId, costoActual, productoNombre, unidadNombre, factor } = customEvent.detail
      
      try {
        // Consultar la API para obtener todos los datos del producto
        const { productosApiV2 } = await import('~/lib/api/producto')
        const response = await productosApiV2.getById(productoId)
        
        if (response.data) {
          const producto = response.data
          
          // Buscar el producto en el almacén actual
          const productoEnAlmacen = producto.producto_en_almacenes?.find(
            (pa: any) => pa.almacen_id === almacen_id
          )
          
          if (!productoEnAlmacen) {
            console.error('Producto no encontrado en el almacén actual')
            return
          }
          
          // Buscar la unidad derivada específica
          const unidadDerivada = productoEnAlmacen.unidades_derivadas?.find(
            (ud: any) => ud.unidad_derivada.id === unidadDerivadaId
          )
          
          if (!unidadDerivada) {
            console.error('Unidad derivada no encontrada')
            return
          }
          
          // Construir el detallePrecio con todos los datos reales
          setDetallePrecioSeleccionado({
            id: unidadDerivada.id,
            producto_id: productoId,
            unidad_derivada_id: unidadDerivadaId,
            factor: unidadDerivada.factor,
            precio_publico: unidadDerivada.precio_publico || 0,
            comision_publico: unidadDerivada.comision_publico || 0,
            precio_especial: unidadDerivada.precio_especial || 0,
            comision_especial: unidadDerivada.comision_especial || 0,
            activador_especial: unidadDerivada.activador_especial || 0,
            precio_minimo: unidadDerivada.precio_minimo || 0,
            comision_minimo: unidadDerivada.comision_minimo || 0,
            activador_minimo: unidadDerivada.activador_minimo || 0,
            precio_ultimo: unidadDerivada.precio_ultimo || 0,
            comision_ultimo: unidadDerivada.comision_ultimo || 0,
            activador_ultimo: unidadDerivada.activador_ultimo || 0,
            producto: {
              id: producto.id,
              name: producto.name,
              cod_barra: producto.cod_barra || '',
            },
            unidad_derivada: unidadDerivada.unidad_derivada,
            producto_almacen: {
              costo: productoEnAlmacen.costo,
              stock_fraccion: productoEnAlmacen.stock_fraccion,
              ubicacion: productoEnAlmacen.ubicacion,
            },
          } as any)
          
          // Actualizar el store con el producto completo para que el modal lo use
          const { useStoreProductoSeleccionadoSearch } = await import('~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search')
          useStoreProductoSeleccionadoSearch.getState().setProducto(producto as any)
          
          setModalEditarPreciosOpen(true)
        }
      } catch (error) {
        console.error('Error al cargar datos del producto:', error)
      }
    }

    window.addEventListener('openEditarPreciosModal', handleOpenModal)
    return () => window.removeEventListener('openEditarPreciosModal', handleOpenModal)
  }, [almacen_id])

  // Escuchar cambios en el proveedor_id del form usando form.getFieldValue
  useEffect(() => {
    const currentProveedorId = form.getFieldValue('proveedor_id')
    setProveedorId(currentProveedorId)
  }, [form])

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
        costo_actual: (p as any).costo_actual ?? 0,
      }))
      // Pre-cargar proveedor en el SelectProveedores para mostrar RUC correctamente
      if (orden.proveedor) {
        setProveedorDefault([{
          id: orden.proveedor.id,
          ruc: orden.proveedor.ruc,
          razon_social: orden.proveedor.razon_social,
        }])
        setProveedorRucInicial(orden.proveedor.ruc)
      }

      form.setFieldsValue({
        fecha: dayjs(orden.fecha) as unknown as Dayjs,
        orden_compra_id: orden.id,
        proveedor_id: orden.proveedor_id ?? undefined,
        proveedor_ruc: orden.proveedor?.ruc ?? '',
        proveedor_razon_social: orden.proveedor?.razon_social ?? '',
        tipo_moneda: orden.tipo_moneda as TipoMoneda,
        tipo_de_cambio: orden.tipo_de_cambio,
        forma_de_pago: orden.forma_de_pago as FormaDePago,
        numero_dias: orden.numero_dias ?? undefined,
        fecha_vencimiento: orden.fecha_vencimiento ? dayjs(orden.fecha_vencimiento) as unknown as Dayjs : undefined,
        tipo_documento: TipoDocumento.Factura,
        productos,
        estado_de_compra: EstadoDeCompra.Creado,
      })

      // Set proveedor ID for calificación
      if (orden.proveedor_id) {
        setProveedorId(orden.proveedor_id)
      }

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
    <div className='relative w-full h-full'>
      <AperturaGuard />
      <FloatingCalificacionProveedor
        calificacion={calificacionResponse?.data?.data}
        loading={loadingCalificacion}
        proveedorId={proveedorId}
      />
      <FormBase
        form={form}
        name='compra'
        className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full'
        onFinish={handleSubmit}
        onValuesChange={(_, allValues) => {
          // Actualizar proveedorId cuando cambia en el form
          if (allValues.proveedor_id !== undefined) {
            setProveedorId(allValues.proveedor_id)
          }
        }}
      >
        <div className='flex-1 flex flex-col gap-2 xl:gap-3 min-w-0 min-h-0'>
          <ConfigurableElement componentId='gestion-comercial.crear-compra.tabla-productos' label='Tabla de Productos'>
            <div className='flex-1 min-h-0'>
              <FormTableComprar form={form} compra={compra} />
            </div>
          </ConfigurableElement>
          <FormCrearCompra 
            form={form} 
            compra={compra} 
            proveedorOptionsDefault={proveedorDefault} 
            initialSearchTextProveedor={proveedorRucInicial}
            onProveedorChange={setProveedorId}
          />
        </div>
        <div className='w-full xl:w-auto'>
          <CardsInfoCompra
            form={form}
            compra={compra}
            loading={loading}
            onOrdenLoaded={orden => {
              if (orden.proveedor) {
                setProveedorDefault([{
                  id: orden.proveedor.id,
                  ruc: orden.proveedor.ruc,
                  razon_social: orden.proveedor.razon_social,
                }])
                setProveedorRucInicial(orden.proveedor.ruc)
              }
            }}
            onPonerEnEspera={() => {
              form.setFieldValue('estado_de_compra', EstadoDeCompra.EnEspera)
              handleSubmit(form.getFieldsValue(true))
            }}
          />
        </div>
      </FormBase>

      {/* Modal para editar precios de venta */}
      <ModalEditarPreciosProducto
        open={modalEditarPreciosOpen}
        setOpen={setModalEditarPreciosOpen}
        detallePrecio={detallePrecioSeleccionado}
        almacen_id={almacen_id ?? 0}
      />
    </div>
  )
}
