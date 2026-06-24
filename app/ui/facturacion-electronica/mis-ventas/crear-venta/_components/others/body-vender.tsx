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
import dayjs, { Dayjs } from 'dayjs'
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
    // Categoría del producto, para descuentos de vale scopeados "Por Categoría".
    categoria_id?: number
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
  // Slots del selector Cel 1 / Cel 2 (ver cliente-telefonos-form)
  telefono_seleccionado?: string
  _cliente_telefono_1?: string
  _cliente_telefono_2?: string
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
  tipo_despacho?: 'EnTienda' | 'Domicilio' | 'Parcial' | 'Omitir' | 'OmitirConStock'
  despachador_id?: string
  fecha_programada?: string
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
  // La cotización origen ya descontó stock (reservar_stock=true): no descontar de nuevo.
  stock_ya_aplicado?: boolean
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
      onFinish={(values) => handleSubmit({
          ...values,
          // form.getFieldValue reads the FieldStore directly (where setFieldValue writes).
          // Native <input type="hidden"> children don't relay setFieldValue back through
          // onFinish reliably, so we inject this field explicitly.
          direccion_seleccionada: form.getFieldValue('direccion_seleccionada') || undefined,
        })}
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
  // Cuando se cierra el modal forzamos formCleaned=true para que ventaData_ sea undefined
  // inmediatamente, sin esperar los ~500ms de la navegación de Next.js.
  const [formCleaned, setFormCleaned] = useState(false)
  useCheckAperturaDiaria()

  // Cuando llega una nueva cotización (o se quita), resetear el flag de limpieza
  useEffect(() => {
    if (cotizacion) setFormCleaned(false)
  }, [cotizacion])

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
    // La fecha de la venta es HOY, no la fecha de la cotización.
    fecha: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    // La cotización guarda los días de crédito en `vigencia_dias`, pero el form de
    // venta (y useInitVenta) leen `numero_dias`. Traducir aquí para no perder los
    // días al cargar una cotización a crédito.
    numero_dias: cotizacion.vigencia_dias,
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

  // Usar venta si existe (notasMerged), sino usar ventaFromCotizacion.
  // formCleaned=true fuerza undefined para que el form quede vacío inmediatamente
  // al cerrar el modal, sin esperar la navegación de Next.js (~500ms).
  const ventaData_ = formCleaned ? undefined : (venta || ventaFromCotizacion)
  // Si `venta` llega por prop, estamos editando una venta existente.
  // No dependemos del prefijo del ID: hoy las ventas usan ULID (`01...`),
  // por lo que el chequeo histórico `startsWith('ven')` rompía la edición
  // y terminaba creando una venta nueva.
  const isEditingVenta = !!venta?.id
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
      setProductoAgregado(undefined)
      setProductos([])
      setValesAplicables([])

      if (venta?.id || cotizacion?.id) {
        // formCleaned=true hace que ventaData_=undefined en el mismo ciclo de React,
        // así el form queda vacío DURANTE la animación de cierre del modal (sin esperar
        // los ~500ms de la navegación). La navegación sólo limpia la URL.
        setFormCleaned(true)
        setFormKey(prev => prev + 1)
        router.push('/ui/facturacion-electronica/mis-ventas/crear-venta')
        return
      }

      setFormKey(prev => prev + 1)
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
