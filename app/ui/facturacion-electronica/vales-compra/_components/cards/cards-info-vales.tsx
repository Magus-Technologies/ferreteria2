'use client'

import CardMiniInfo from './card-mini-info'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getValesCompra } from '~/lib/api/vales-compra'
import { valesCompraKeys } from '~/lib/api/vales-compra'

export default function CardsInfoVales() {
  const { data: response } = useQuery({
    queryKey: valesCompraKeys.lists(),
    queryFn: async () => {
      const result = await getValesCompra({ per_page: 100 })
      return result.data?.data || []
    },
  })

  // Calcular todos los totales
  const totales = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return {
        activos: 0,
        pausados: 0,
        finalizados: 0,
        vigentes: 0,
        totalVales: 0,
        conStock: 0,
      }
    }

    let activos = 0
    let pausados = 0
    let finalizados = 0
    let vigentes = 0
    let conStock = 0

    const ahora = new Date()

    response.forEach((vale) => {
      // Contar por estado
      if (vale.estado === 'ACTIVO') activos++
      if (vale.estado === 'PAUSADO') pausados++
      if (vale.estado === 'FINALIZADO') finalizados++

      // Contar vigentes (dentro del rango de fechas)
      const inicioValido = new Date(vale.fecha_inicio) <= ahora
      const finValido = !vale.fecha_fin || new Date(vale.fecha_fin) >= ahora
      if (inicioValido && finValido) vigentes++

      // Contar con stock disponible
      if (!vale.usa_limite_stock || (vale.stock_disponible && vale.stock_disponible > 0)) {
        conStock++
      }
    })

    return {
      activos,
      pausados,
      finalizados,
      vigentes,
      totalVales: response.length,
      conStock,
    }
  }, [response])

  return (
    <>
      <CardMiniInfo
        title='Total Vales'
        value={totales.totalVales}
        valueColor='text-blue-700'
        className='h-full'
      />
      <CardMiniInfo
        title='Activos'
        value={totales.activos}
        valueColor='text-green-600'
        className='h-full'
      />
      <CardMiniInfo
        title='Vigentes'
        value={totales.vigentes}
        valueColor='text-blue-600'
        className='h-full'
      />
      <CardMiniInfo
        title='Con Stock'
        value={totales.conStock}
        valueColor='text-green-500'
        className='h-full'
      />
      <CardMiniInfo
        title='Finalizados'
        value={totales.finalizados}
        valueColor='text-red-600'
        className='h-full'
      />
    </>
  )
}
