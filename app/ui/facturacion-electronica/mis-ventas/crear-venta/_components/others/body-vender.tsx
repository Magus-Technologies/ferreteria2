'use client'

import {
  EstadoDeVenta,
  FormaDePago,
  TipoMoneda,
  TipoDocumento,
  DescuentoTipo,
} from '~/lib/api/venta'
import { TipoPedido } from '~/lib/api/entrega-producto'
import type { TipoDireccion } from '~/lib/api/cliente'
import type { ClienteDireccionFormFields } from '~/lib/utils/cliente-direcciones-form'
import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FormBase from '~/components/form/form-base'
import useCreateVenta from '../../_hooks/use-create-venta'
import useInitVenta from '../../_hooks/use-init-venta'
import { ventaEvents } from '../../_hooks/venta-events'
import { VentaConUnidadDerivadaNormal } from './header-crear-venta'
import dynamic from 'next/dynamic'
import FormTableVender from '../form/form-table-vender'
import FormCrearVenta from '../form/form-crear-venta'
import CardsInfoVenta from '../cards/cards-info-venta'
import AlertaPreciosActualizados from '../alerts/alerta-precios-actualizados'

const ModalDocVenta = dynamic(() => import('../../../_components/modals/modal-doc-venta'), { ssr: false })
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import { cotizacionesApi } from '~/lib/api/cotizaciones'
import { useCheckAperturaDiaria } from '../../_hooks/use-check-apertura-diaria'
import AperturaGuard from '~/app/ui/_components/apertura-auto-check'

export type FormCreateVenta = ClienteDireccionFormFields & {
  productos: Array<{
    _tipo?: 'producto' | 'servicio'
    _tipo_fila?: 'paquete_cabecera' | 'paquete_producto' | 'vale_promocional'
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
    stock_fraccion?: number
    tipo_precio?: string
    // Campos para identificar si el producto pertenece a un paquete
    paquete_id?: number
    paquete_nombre?: string
    cantidad_paquete?: number
    cantidad_base?: number
    // Campos para servicios
    servicio_id?: number
    servicio_nombre?: string
    servicio_codigo_sunat?: string | null
    servicio_referencia?: string
    costo?: number
  }>
  fecha: Dayjs
  forma_de_pago: FormaDePago
  numero_dias?: number
  fecha_vencimiento?: Dayjs
  tipo_documento: TipoDocumento
  tipo_moneda: TipoMoneda
  tipo_de_cambio?: number
  estado_de_venta?: EstadoDeVenta
  despliegue_de_pago_id?: string
  cliente_id?: number
  recomendado_por_id?: number
  direccion?: string
  direccion_seleccionada?: TipoDireccion
  // Campos legacy `_cliente_direccion_*` heredados de `ClienteDireccionFormFields`.
  ruc_dni?: string
  cliente_nombre?: string
  telefono?: string
  email?: string
  metodos_de_pago?: Array<{
    despliegue_de_pago_id: string
    monto: number
    numero_operacion?: string
    recibe_efectivo?: number
    sobrecargo?: {
      tipo: string
      valor: number
      monto: number
    }
  }>
  // ✅ Campos de entrega
  tipo_despacho?: 'EnTienda' | 'Domicilio' | 'Parcial'
  despachador_id?: string
  fecha_programada?: Dayjs
  hora_inicio?: string
  hora_fin?: string
  direccion_entrega?: string
  referencia_entrega?: string
  latitud?: number
  longitud?: number
  observaciones?: string
  quien_entrega?: 'vendedor' | 'almacen' | 'chofer'
  cantidades_parciales?: Array<{
    producto_id: number
    producto_name: string
    producto_codigo: string
    unidad_derivada_id: number
    unidad_derivada_name: string
    total: number
    entregado: number
    pendiente: number
    entregar: number
    entregar_programado?: number
  }>
  // Datos para programar la entrega del resto en despacho parcial mixto
  parcial_resto_programado?: {
    tipo_pedido?: TipoPedido
    despachador_id?: string
    cargo_destino?: string
    fecha_programada?: string
    hora_inicio?: string
    hora_fin?: string
    direccion_entrega?: string
    referencia_entrega?: string
    latitud?: number
    longitud?: number
    observaciones?: string
    vehiculo_id?: number
  }
  codigo_vale?: string
  tipo_pedido?: string
  cargo_destino?: string
  vehiculo_id?: number
  // Flag para indicar que se presionó "Omitir" en el modal de entrega:
  // la venta se crea pero NO se genera la entrega automática (no descuenta stock).
  _omitir_entrega?: boolean
  // Toggle manual del usuario: si "no", fuerza no descontar stock (equivalente a omitir).
  descontar_stock?: 'si' | 'no'
}

// Componente interno que se recrea completamente cuando cambia la key
function FormVentaInternal({
  venta,
  handleSubmit,
  onMissingApertura,
  submitting,
  isEditingVenta,
}: {
  venta?: VentaConUnidadDerivadaNormal
  handleSubmit: (values: FormCreateVenta) => void
  onMissingApertura?: () => void
  submitting?: boolean
  isEditingVenta?: boolean
}) {
  const [form] = Form.useForm<FormCreateVenta>()
  useInitVenta({ venta, form })

  return (
    <FormBase<FormCreateVenta>
      form={form}
      name='venta'
      className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full xl:h-full'
      onFinish={handleSubmit}
    >
      <div className='xl:flex-1 flex flex-col gap-4 xl:gap-6 min-w-0 xl:min-h-0'>
        <AlertaPreciosActualizados form={form} />
        <div className='xl:flex-1 xl:min-h-0'>
          <FormTableVender form={form} venta={venta} />
        </div>
        <FormCrearVenta form={form} venta={venta} />
      </div>
      <div className='w-full xl:w-auto'>
        <CardsInfoVenta form={form} ventaId={isEditingVenta ? venta?.id : undefined} onMissingApertura={onMissingApertura} submitting={submitting} />
      </div>
    </FormBase>
  )
}

export default function BodyVender({
  venta,
  cotizacion,
}: {
  venta?: VentaConUnidadDerivadaNormal
  cotizacion?: any
} = {}) {
  const router = useRouter()
  const [openDoc, setOpenDoc] = useState(false)
  const [ventaId, setVentaId] = useState<string>()
  const [ventaCreada, setVentaCreada] = useState<any>()
  const [formKey, setFormKey] = useState(0)
  useCheckAperturaDiaria()

  // Obtener funciones del store para limpiar
  const setProductoAgregado = useStoreProductoAgregadoVenta(state => state.setProductoAgregado)
  const setProductos = useStoreProductoAgregadoVenta(state => state.setProductos)
  const setValesAplicables = useStoreProductoAgregadoVenta(state => state.setValesAplicables)

  // Convertir cotización a formato de venta si existe
  // Laravel puede devolver productosPorAlmacen (camelCase) o productos_por_almacen (snake_case)
  // y unidades_derivadas viene como snake_case del backend
  const productosFromCotizacion = cotizacion?.productosPorAlmacen ?? cotizacion?.productos_por_almacen;
  const ventaFromCotizacion = cotizacion ? {
    ...cotizacion,
    productos_por_almacen: productosFromCotizacion?.map((ppa: any) => ({
      ...ppa,
      unidades_derivadas: ppa.unidades_derivadas?.map((ud: any) => {
        // Resolver la unidad real buscando por factor (estable y único por producto_almacen).
        // `unidad_derivada_inmutable.id` es un snapshot histórico y NO coincide con el
        // `unidad_derivada.id` actual, por eso los selects mostraban "-".
        const factorBuscado = Number(ud.factor);
        const unidadDisponible = ppa.producto_almacen?.unidades_derivadas?.find(
          (u: any) => Number(u.factor) === factorBuscado
        );
        return {
          ...ud,
          unidad_derivada_normal: {
            id: unidadDisponible?.unidad_derivada?.id ?? ud.unidad_derivada_inmutable?.id ?? ud.unidadDerivadaInmutable?.id,
            name: unidadDisponible?.unidad_derivada?.name ?? ud.unidad_derivada_inmutable?.name ?? ud.unidadDerivadaInmutable?.name,
          },
        };
      }),
    })),
  } : undefined

  // Usar venta si existe (notasMerged), sino usar ventaFromCotizacion
  // NO usar ventaId de cotizacion porque es un ID de cotización, no de venta
  const ventaData_ = venta || ventaFromCotizacion
  // Determinar si estamos editando una venta existente (NO una cotización convertida)
  // Las notas de venta tienen IDs que empiezan con 'ven', las notasMerged son ventas reales
  const isEditingVenta = !!(venta?.id && String(venta.id).startsWith('ven'))
  const { handleSubmit, loading: creandoVenta } = useCreateVenta({ 
    ventaId: isEditingVenta ? venta.id : undefined 
  })
  useEffect(() => {
    const unsubscribe = ventaEvents.on((data) => {
      setVentaId(String(data.id))
      setVentaCreada(data)
      setOpenDoc(true)
      // Vincular la cotización a la venta recién creada para bloquear el botón
      if (cotizacion?.id) {
        cotizacionesApi.vincularVenta(cotizacion.id, String(data.id)).catch(() => {})
      }
    })

    // Cleanup al desmontar
    return unsubscribe
  }, [])

  // Escuchar evento de venta puesta en espera (limpiar sin abrir modal de documento)
  useEffect(() => {
    const unsubscribe = ventaEvents.onEspera(() => {
      setProductoAgregado(undefined)
      setProductos([])
      setValesAplicables([])
      setFormKey(prev => prev + 1)
    })

    return unsubscribe
  }, [setProductoAgregado, setProductos, setValesAplicables])
  
  // Limpiar formulario cuando se cierra el modal
  useEffect(() => {
    if (!openDoc && ventaId) {
      // Limpiar el store de productos agregados
      setProductoAgregado(undefined)
      setProductos([])
      setValesAplicables([])

      // Limpiar formulario
      setFormKey(prev => prev + 1)

      // Si venimos de editar una venta o de convertir una cotización,
      // redirigir a crear-venta limpia para que el form quede vacío
      if (venta?.id || cotizacion?.id) {
        router.push('/ui/facturacion-electronica/mis-ventas/crear-venta')
        return
      }

      // Limpiar ventaId y datos después de un momento
      setTimeout(() => {
        setVentaId(undefined)
        setVentaCreada(undefined)
      }, 100)
    }
  }, [openDoc, ventaId, setProductoAgregado, setProductos, setValesAplicables, venta?.id, router])

  return (
    <>
      <AperturaGuard />
      <ModalDocVenta
        open={openDoc}
        setOpen={setOpenDoc}
        ventaId={ventaId}
        ventaData={ventaCreada}
      />
      <FormVentaInternal
        key={formKey}
        venta={ventaData_}
        handleSubmit={handleSubmit}
        submitting={creandoVenta}
        isEditingVenta={isEditingVenta}
      />
    </>
  )
}
