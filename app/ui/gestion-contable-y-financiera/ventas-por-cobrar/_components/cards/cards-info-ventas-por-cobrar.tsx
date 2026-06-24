'use client'

import { type VentaCompleta } from '~/lib/api/venta'
import { useStoreVentasFiltradas } from '../tables/table-ventas-por-cobrar'
import { useMemo } from 'react'
import dayjs from 'dayjs'

export default function CardsInfoVentasPorCobrar() {
  // Consumimos las ventas ya filtradas por la tabla, así las tarjetas reflejan
  // exactamente los mismos filtros (almacén, cliente, vendedor, fechas, estado
  // de pago, tipo de documento, búsqueda y rango de mora) sin duplicar la query.
  const ventas = useStoreVentasFiltradas(state => state.ventas)
  const isLoading = useStoreVentasFiltradas(state => state.loading)

  // Función para calcular el total de una venta
  const calcularTotalVenta = (venta: VentaCompleta) => {
    return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
      for (const u of item.unidades_derivadas ?? []) {
        const precio = Number(u.precio ?? 0)
        const cantidad = Number(u.cantidad ?? 0)
        const descuento = Number(u.descuento ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (precio * cantidad) - descuento
        acc += montoLinea
      }
      return acc
    }, 0)
  }

  // Calcular estadísticas de las ventas por cobrar
  const estadisticas = useMemo(() => {
    let totalACobrar = 0
    let totalCobrado = 0
    let totalSaldo = 0
    let saldoVencido30 = 0
    let saldoVencido60 = 0
    let saldoVencido90 = 0

    ventas.forEach(venta => {
      // Calcular saldo
      const total = calcularTotalVenta(venta)
      const totalPagado = Number(venta.total_cobrado || 0)
      const saldo = total - totalPagado
      totalACobrar += total
      totalCobrado += totalPagado
      totalSaldo += saldo

      // Calcular días vencidos y acumular saldo por categoría
      if (venta.fecha) {
        const fechaVenta = dayjs(venta.fecha)
        const hoy = dayjs()
        const diasVencidos = hoy.diff(fechaVenta, 'days')

        if (diasVencidos > 90) {
          saldoVencido90 += saldo
        } else if (diasVencidos > 60) {
          saldoVencido60 += saldo
        } else if (diasVencidos > 30) {
          saldoVencido30 += saldo
        }
      }
    })

    return {
      totalVentas: ventas.length,
      totalACobrar,
      totalCobrado,
      totalSaldo,
      saldoVencido30,
      saldoVencido60,
      saldoVencido90,
    }
  }, [ventas])

  if (isLoading) {
    return (
      <div className='flex flex-col gap-3 h-full'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='bg-white border border-slate-200 rounded-lg p-5 animate-pulse'>
            <div className='h-4 bg-slate-200 rounded w-3/4 mx-auto mb-3'></div>
            <div className='h-8 bg-slate-200 rounded w-1/2 mx-auto'></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3 h-full'>
      {/* Total a Cobrar */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-blue-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Total a Cobrar
        </h3>
        <p className='text-xl font-bold text-nowrap text-blue-600'>
          S/.{' '}
          {estadisticas.totalACobrar.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Cobrado */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-green-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Cobrado
        </h3>
        <p className='text-xl font-bold text-nowrap text-green-600'>
          S/.{' '}
          {estadisticas.totalCobrado.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Total Saldo Pendiente */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-red-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Saldo Total Pendiente
        </h3>
        <p className='text-xl font-bold text-nowrap text-red-600'>
          S/.{' '}
          {estadisticas.totalSaldo.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Vencidas +30 días */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-orange-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Vencidas +30 días
        </h3>
        <p className='text-xl font-bold text-nowrap text-orange-600'>
          S/.{' '}
          {estadisticas.saldoVencido30.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Vencidas +60 días */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-red-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Vencidas +60 días
        </h3>
        <p className='text-xl font-bold text-nowrap text-red-600'>
          S/.{' '}
          {estadisticas.saldoVencido60.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Vencidas +90 días */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-red-300 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Vencidas +90 días
        </h3>
        <p className='text-xl font-bold text-nowrap text-red-700'>
          S/.{' '}
          {estadisticas.saldoVencido90.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  )
}
