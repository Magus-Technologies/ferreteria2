'use client'

import { useMemo } from 'react'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'

export default function TotalMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)

  // Mock calculation - replace with actual API call
  const totalIngresos = useMemo(() => {
    // This would normally come from an API call based on filtros
    return 15250.50
  }, [filtros])

  return (
    <div className='flex items-center gap-2 text-sm'>
      <span className='text-gray-600'>Total:</span>
      <span className='font-semibold text-green-600'>
        S/. {totalIngresos.toFixed(2)}
      </span>
    </div>
  )
}