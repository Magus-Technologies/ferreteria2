'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useServerQuery } from '~/hooks/use-server-query'
import { getProductos } from '~/app/_actions/producto'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'

export default function CardsInfo() {
  const filtros = useStoreFiltrosProductos(state => state.filtros)

  const { response } = useServerQuery({
    action: getProductos,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS],
      enabled: false,
    },
    params: {
      where: filtros,
    },
  })

  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const inversion =
    response?.reduce((acc, producto) => {
      const producto_en_almacen = producto.producto_en_almacenes?.find(
        item => item.almacen_id === almacen_id
      )
      return (
        acc +
        Number(producto_en_almacen?.costo ?? 0) *
          Number(producto_en_almacen?.stock_fraccion ?? 0)
      )
    }, 0) || 0

  const precio_venta =
    response?.reduce((acc, producto) => {
      const producto_en_almacen = producto.producto_en_almacenes?.find(
        item => item.almacen_id === almacen_id
      )

      const unidad_derivada =
        producto_en_almacen?.unidades_derivadas?.find(
          ud => Number(ud.factor) == 1
        ) ?? producto_en_almacen?.unidades_derivadas[0]

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
    }, 0) || 0

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
