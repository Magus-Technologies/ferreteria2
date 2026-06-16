'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { useQuery } from '@tanstack/react-query'
import { inventarioReporteApi } from '~/lib/api/inventario-reporte'

export default function CardsInfo() {
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const filtros = useStoreFiltrosProductos(store => store.filtros)

  const { data: resumen } = useQuery({
    queryKey: ['inventario-resumen', almacen_id, filtros?.categoria_id, filtros?.marca_id, filtros?.search],
    queryFn: async () => {
      const res = await inventarioReporteApi.getResumen({
        almacen_id,
        categoria_id: filtros?.categoria_id,
        marca_id: filtros?.marca_id,
        search: filtros?.search,
      })
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? null
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!almacen_id,
  })

  const inversion = resumen?.valorizacion_total ?? 0
  const precio_venta = resumen?.valorizacion_venta ?? 0

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
