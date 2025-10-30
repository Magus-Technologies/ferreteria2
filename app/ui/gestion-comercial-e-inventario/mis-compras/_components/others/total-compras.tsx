import { QueryKeys } from '~/app/_lib/queryKeys'
import { useServerQuery } from '~/hooks/use-server-query'
import { getCompras } from '~/app/_actions/compra'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'

export default function TotalCompras() {
  const filtros = useStoreFiltrosMisCompras(state => state.filtros)

  const { response: data } = useServerQuery({
    action: getCompras,
    propsQuery: {
      queryKey: [QueryKeys.COMPRAS],
      enabled: false,
    },
    params: {
      where: filtros,
    },
  })

  const costo_total = (data ?? []).reduce((acc, compra) => {
    return (
      acc +
      (
        compra?.productos_por_almacen?.flatMap(ppa =>
          ppa.unidades_derivadas.map(ud => ({
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
