'use client'

import { useStoreFiltrosMisVentas } from '../../_store/store-filtros-mis-ventas'
import useGetVentas from '../../_hooks/use-get-ventas'

export default function TotalVentas() {
  const filtros = useStoreFiltrosMisVentas(state => state.filtros)
  const { response } = useGetVentas({ where: filtros })

  const total = response?.reduce((acc, venta) => {
    const subtotal = venta.productos_por_almacen.reduce((sum, producto) => {
      const productoTotal = producto.unidades_derivadas.reduce(
        (pSum, unidad) => {
          return (
            pSum +
            Number(unidad.cantidad) *
              Number(unidad.factor) *
              Number(unidad.precio)
          )
        },
        0
      )
      return sum + productoTotal
    }, 0)
    return acc + subtotal
  }, 0)

  return (
    <div className='flex items-center gap-2 text-white font-semibold text-lg'>
      <span>Total Ventas:</span>
      <span className='text-yellow-300'>
        S/. {total?.toFixed(2) ?? '0.00'}
      </span>
    </div>
  )
}
