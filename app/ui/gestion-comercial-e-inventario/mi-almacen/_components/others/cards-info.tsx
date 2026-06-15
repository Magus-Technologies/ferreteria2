'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { useMemo } from 'react'
import { useProductosListadoCompleto } from '../../_hooks/useProductosListadoCompleto'

export default function CardsInfo() {
  const filtros = useStoreFiltrosProductos(state => state.filtros)
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const almacenActual = filtros?.almacen_id || almacen_id || 1

  const { data: productos } = useProductosListadoCompleto(almacenActual)

  const { inversion, precio_venta } = useMemo(() => {
    if (!Array.isArray(productos) || productos.length === 0) {
      return { inversion: 0, precio_venta: 0 }
    }

    const inversionTotal = productos.reduce((acc, producto) => {
      const producto_en_almacen = producto.producto_en_almacenes?.find(
        item => item.almacen_id === almacenActual
      )
      return (
        acc +
        Number(producto_en_almacen?.costo ?? 0) *
          Number(producto_en_almacen?.stock_fraccion ?? 0)
      )
    }, 0)

    const precioVentaTotal = productos.reduce((acc, producto) => {
      const producto_en_almacen = producto.producto_en_almacenes?.find(
        item => item.almacen_id === almacenActual
      )

      const unidad_derivada =
        producto_en_almacen?.unidades_derivadas?.find(
          ud => Number(ud.factor) == 1
        ) ?? producto_en_almacen?.unidades_derivadas?.[0]

      const precio_publico = Number(unidad_derivada?.precio_publico ?? 0)
      const factor = Number(unidad_derivada?.factor ?? 0)

      return (
        acc +
        (factor == 1
          ? precio_publico
          : factor == 0
          ? 0
          : precio_publico / factor) *
          Number(producto_en_almacen?.stock_fraccion ?? 0)
      )
    }, 0)

    return { inversion: inversionTotal, precio_venta: precioVentaTotal }
  }, [productos, almacenActual])

  return (
    <>
      <CardMiniInfo title='Inversión' value={inversion} className='h-full' />
      <CardMiniInfo
        title='P. Venta Aprox'
        value={precio_venta}
        className='h-full'
      />
      <CardMiniInfo
        title='Utilidad Aprox'
        value={precio_venta - inversion}
        className='h-full'
      />
    </>
  )
}
