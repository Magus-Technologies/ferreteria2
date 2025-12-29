import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'
import { compraApi } from '~/lib/api/compra'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { EstadoDeCompra } from '@prisma/client'

export default function TotalCompras() {
  const filtros = useStoreFiltrosMisCompras(state => state.filtros)

  // Convert Prisma filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined

    return {
      almacen_id: filtros.almacen_id as number | undefined,
      estado_de_compra: filtros.estado_de_compra
        ? (filtros.estado_de_compra as { equals?: EstadoDeCompra })?.equals
        : undefined,
      proveedor_id: filtros.proveedor_id as number | undefined,
      per_page: 9999, // Get all records for total calculation
    }
  }, [filtros])

  const { data: response } = useQuery({
    queryKey: [QueryKeys.COMPRAS, 'total', apiFilters],
    queryFn: async () => {
      const result = await compraApi.getAll(apiFilters)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!
    },
    enabled: false,
  })

  const data = response?.data ?? []

  const costo_total = (data ?? []).reduce((acc, compra) => {
    return (
      acc +
      (
        compra?.productos_por_almacen?.flatMap(ppa =>
          (ppa.unidades_derivadas ?? []).map(ud => ({
            ...ud,
            costo: ppa.costo,
            producto_almacen: ppa.producto_almacen,
          }))
        ) ?? []
      ).reduce(
        (acc, ppa) =>
          acc +
          Number(ppa.costo) *
            Number(compra.tipo_de_cambio) *
            Number(ppa.cantidad) *
            Number(ppa.factor),
        0
      )
    )
  }, 0)

  return (
    <div className='flex items-center gap-2 font-bold text-2xl'>
      <div className='text-slate-700'>TOTAL:</div>
      <div className='text-slate-900 text-nowrap'>
        S/.{' '}
        {costo_total.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })}
      </div>
    </div>
  )
}
