'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useQuery } from '@tanstack/react-query'
import { inventarioReporteApi } from '~/lib/api/inventario-reporte'

export default function CardsInfo() {
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const { data: resumen } = useQuery({
    queryKey: ['inventario-resumen', almacen_id],
    queryFn: async () => {
      const res = await inventarioReporteApi.getResumen({ almacen_id })
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
