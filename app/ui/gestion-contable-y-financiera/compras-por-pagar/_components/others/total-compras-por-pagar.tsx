'use client'

import { useQuery } from '@tanstack/react-query'
import { Spin } from 'antd'
import { compraApi } from '~/lib/api/compra'
import { useStoreFiltrosComprasPorPagar } from '../../_store/store-filtros-compras-por-pagar'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function TotalComprasPorPagar() {
  const filtros = useStoreFiltrosComprasPorPagar((state) => state.filtros)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.COMPRAS_POR_PAGAR, 'resumen', filtros],
    queryFn: async () => {
      const result = await compraApi.getResumen(filtros as any)
      if (result.error) throw new Error(result.error.message)
      return result.data?.data
    },
    enabled: !!filtros,
  })

  if (isLoading) {
    return (
      <div className='flex items-center gap-2'>
        <Spin size='small' />
        <span className='text-sm text-slate-600'>Calculando...</span>
      </div>
    )
  }

  const saldoPendiente = data?.saldo_pendiente ?? 0

  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm font-semibold text-slate-600'>Total por Pagar:</span>
      <span className='text-lg font-bold text-red-600'>
        S/. {saldoPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}
