'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { useMemo } from 'react'
import { useProductosInfiniteScroll } from '../../_hooks/useProductosInfiniteScroll'

export default function CardsInfo() {
  const filtros = useStoreFiltrosProductos(state => state.filtros)
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  // Reutilizar el mismo hook y queryKey que la tabla principal para evitar peticiones duplicadas
  const { data: response } = useProductosInfiniteScroll({
    filtros: {
      ...filtros,
      almacen_id: filtros?.almacen_id || almacen_id || 1,
    },
    enabled: !!filtros?.almacen_id,
    perPage: 1000,
  })

  // Memoizar los cálculos para evitar recálculos innecesarios
  const { inversion, precio_venta } = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return { inversion: 0, precio_venta: 0 }
    }

    const inversionTotal = response.reduce((acc, producto) => {
      const producto_en_almacen = producto.producto_en_almacenes?.find(
        item => item.almacen_id === almacen_id
      )
      return (
        acc +
        Number(producto_en_almacen?.costo ?? 0) *
          Number(producto_en_almacen?.stock_fraccion ?? 0)
      )
    }, 0)

    const precioVentaTotal = response.reduce((acc, producto) => {
      const producto_en_almacen = producto.producto_en_almacenes?.find(
        item => item.almacen_id === almacen_id
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
  }, [response, almacen_id])

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
