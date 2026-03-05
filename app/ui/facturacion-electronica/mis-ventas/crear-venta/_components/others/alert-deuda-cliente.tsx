'use client'

import { useQuery } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { App } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useEffect, useRef } from 'react'

interface AlertDeudaClienteProps {
  clienteId: number | undefined
  onDeudaChange?: (tieneDeuda: boolean) => void
}

const calcularTotalVenta = (venta: VentaCompleta) => {
  return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
    for (const u of item.unidades_derivadas ?? []) {
      const precio = Number(u.precio ?? 0)
      const cantidad = Number(u.cantidad ?? 0)
      const descuento = Number(u.descuento ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      acc += bonificacion ? 0 : (precio * cantidad) - descuento
    }
    return acc
  }, 0)
}

export default function AlertDeudaCliente({ clienteId, onDeudaChange }: AlertDeudaClienteProps) {
  const { notification } = App.useApp()
  const notifiedClienteRef = useRef<number | undefined>(undefined)

  const { data } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, 'deuda-cliente', clienteId],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar({ cliente_id: clienteId, per_page: -1 })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    enabled: !!clienteId,
    staleTime: 60 * 1000,
  })

  const deudas = useMemo(() => {
    const ventas = data?.data ?? []
    return ventas.map(v => {
      const total = calcularTotalVenta(v)
      const cobrado = Number(v.total_cobrado || 0)
      const resta = total - cobrado
      const dias = dayjs().diff(dayjs(v.fecha), 'days')
      return { venta: v, total, cobrado, resta, dias }
    }).filter(d => d.resta > 0.01)
  }, [data?.data])

  const totalDeuda = useMemo(() => deudas.reduce((acc, d) => acc + d.resta, 0), [deudas])
  const tieneDeuda = deudas.length > 0

  useEffect(() => {
    onDeudaChange?.(tieneDeuda)
  }, [tieneDeuda, onDeudaChange])

  // Reset notified ref when client changes
  useEffect(() => {
    if (clienteId !== notifiedClienteRef.current) {
      notifiedClienteRef.current = undefined
    }
  }, [clienteId])

  // Mostrar notificación cuando se detectan deudas del cliente
  useEffect(() => {
    if (clienteId && tieneDeuda && deudas.length > 0 && notifiedClienteRef.current !== clienteId) {
      notifiedClienteRef.current = clienteId
      notification.warning({
        message: 'Cliente con deudas pendientes',
        description: (
          <div>
            <p className='text-red-700 font-semibold mb-2'>
              {deudas.length} venta{deudas.length > 1 ? 's' : ''} pendiente{deudas.length > 1 ? 's' : ''} — Total: S/. {totalDeuda.toFixed(2)}
            </p>
            <div className='max-h-[120px] overflow-y-auto'>
              <table className='w-full text-xs border-collapse'>
                <thead>
                  <tr className='bg-red-100 text-red-800'>
                    <th className='px-1.5 py-0.5 text-left'>Doc</th>
                    <th className='px-1.5 py-0.5 text-right'>Resta</th>
                    <th className='px-1.5 py-0.5 text-center'>Días</th>
                  </tr>
                </thead>
                <tbody>
                  {deudas.map((d) => (
                    <tr key={d.venta.id} className='border-b border-red-100'>
                      <td className='px-1.5 py-0.5'>{d.venta.serie}-{d.venta.numero}</td>
                      <td className='px-1.5 py-0.5 text-right font-bold text-red-600'>S/. {d.resta.toFixed(2)}</td>
                      <td className={`px-1.5 py-0.5 text-center font-bold ${d.dias > 30 ? 'text-red-600' : d.dias > 15 ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {d.dias}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ),
        duration: 8,
        placement: 'topRight',
      })
    }
  }, [clienteId, tieneDeuda, deudas, totalDeuda, notification])

  return null
}

export { AlertDeudaCliente }
