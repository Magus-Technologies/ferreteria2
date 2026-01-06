'use client'

import {
  EstadoDeVenta,
  FormaDePago,
  TipoMoneda,
  TipoDocumento,
  DescuentoTipo,
} from '~/lib/api/venta'
import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import { useState, useEffect } from 'react'
import FormBase from '~/components/form/form-base'
import useCreateVenta from '../../_hooks/use-create-venta'
import useInitVenta from '../../_hooks/use-init-venta'
import { ventaEvents } from '../../_hooks/venta-events'
import { VentaConUnidadDerivadaNormal } from './header-crear-venta'
import FormTableVender from '../form/form-table-vender'
import FormCrearVenta from '../form/form-crear-venta'
import CardsInfoVenta from '../cards/cards-info-venta'
import ModalDocVenta, { type VentaResponse } from '../../../_components/modals/modal-doc-venta'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

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
  direccion?: string
  direccion_seleccionada?: 'D1' | 'D2' | 'D3' | 'D4'
  // Campos temporales del cliente
  _cliente_direccion_1?: string
  _cliente_direccion_2?: string
  _cliente_direccion_3?: string
  _cliente_direccion_4?: string
  ruc_dni?: string
  cliente_nombre?: string
  telefono?: string
  email?: string
  metodos_de_pago?: Array<{
    despliegue_de_pago_id: string
    monto: number
  }>
}

// Componente interno que se recrea completamente cuando cambia la key
function FormVentaInternal({
  venta,
  handleSubmit,
}: {
  venta?: VentaConUnidadDerivadaNormal
  handleSubmit: (values: FormCreateVenta) => void
}) {
  console.log('🏗️ FormVentaInternal rendering with venta:', venta)
  const [form] = Form.useForm<FormCreateVenta>()
  console.log('📋 Form instance created')
  useInitVenta({ venta, form })

  return (
    <FormBase<FormCreateVenta>
      form={form}
      name='venta'
      className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full'
      onFinish={handleSubmit}
    >
      <div className='flex-1 flex flex-col gap-4 xl:gap-6 min-w-0 min-h-0'>
        <div className='flex-1 min-h-0'>
          <FormTableVender form={form} venta={venta} />
        </div>
        <FormCrearVenta form={form} venta={venta} />
      </div>
      <div className='w-full xl:w-auto'>
        <CardsInfoVenta form={form} />
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
  const [openDoc, setOpenDoc] = useState(false)
  const [ventaData, setVentaData] = useState<VentaResponse>()
  const [formKey, setFormKey] = useState(0)

  const { handleSubmit } = useCreateVenta()
  
  // Obtener funciones del store para limpiar
  const setProductoAgregado = useStoreProductoAgregadoVenta(state => state.setProductoAgregado)
  const setProductos = useStoreProductoAgregadoVenta(state => state.setProductos)

  // Convertir cotización a formato de venta si existe
  const ventaFromCotizacion = cotizacion ? {
    ...cotizacion,
    // Mapear los campos de cotización a venta
    productos_por_almacen: cotizacion.productos_por_almacen?.map((ppa: any) => ({
      ...ppa,
      unidades_derivadas: ppa.unidades_derivadas?.map((ud: any) => ({
        ...ud,
        // Mapear unidad_derivada_inmutable a unidad_derivada_normal
        unidad_derivada_normal: {
          id: ud.unidad_derivada_inmutable?.id,
          name: ud.unidad_derivada_inmutable?.name,
        },
      })),
    })),
  } : undefined

  // Usar venta si existe, sino usar ventaFromCotizacion
  const ventaData_  = venta || ventaFromCotizacion

  // Escuchar evento de venta creada
  useEffect(() => {
    const unsubscribe = ventaEvents.on((data) => {
      console.log('🎯 Evento ventaCreada recibido con data:', data)
      
      // Guardar datos y abrir modal inmediatamente
      console.log('🔓 Setting openDoc to true y ventaData')
      setVentaData(data)
      setOpenDoc(true)
    })

    // Cleanup al desmontar
    return unsubscribe
  }, [])
  
  // Limpiar formulario cuando se cierra el modal
  useEffect(() => {
    if (!openDoc && ventaData) {
      console.log('🧹 Modal cerrado, limpiando formulario y store')
      
      // Limpiar el store de productos agregados
      console.log('🗑️ Limpiando store de productos')
      setProductoAgregado(undefined)
      setProductos([])
      
      // Limpiar formulario
      console.log('🔑 Incrementing formKey para limpiar formulario')
      setFormKey(prev => prev + 1)
      
      // Limpiar ventaData después de un momento
      setTimeout(() => {
        setVentaData(undefined)
      }, 100)
    }
  }, [openDoc, ventaData, setProductoAgregado, setProductos])

  console.log('🎭 BodyVender render - openDoc:', openDoc, 'formKey:', formKey, 'ventaData:', ventaData)

  return (
    <>
      <ModalDocVenta
        open={openDoc}
        setOpen={setOpenDoc}
        data={ventaData}
      />
      {/* Recrear completamente el formulario cuando cambia formKey */}
      <FormVentaInternal
        key={formKey}
        venta={ventaData_}
        handleSubmit={handleSubmit}
      />
    </>
  )
}
