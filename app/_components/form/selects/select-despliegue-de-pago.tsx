'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FaMoneyCheckAlt } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiRequest } from '~/lib/api'

interface SelectDespliegueDePagoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  tipoComprobante?: string // '01' = Factura, '03' = Boleta, 'nv' = Nota de Venta
  filterByTipo?: 'efectivo' | 'banco' | 'billetera' | string[] // Filtrar por tipo de método de pago (puede ser array)
  subCajaId?: number // Filtrar por sub-caja específica
}

export default function SelectDespliegueDePago({
  placeholder = 'Método de Pago',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  tipoComprobante,
  filterByTipo,
  subCajaId,
  ...props
}: SelectDespliegueDePagoProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      console.log('🔍 Métodos de pago recibidos del backend:', result.data?.data)
      return result.data?.data || []
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filtrar métodos por tipo de comprobante si se proporciona
  let metodosFiltrados = tipoComprobante
    ? data?.filter((metodo: any) => metodo.tipos_comprobante.includes(tipoComprobante))
    : data

  // Filtrar por sub-caja si se proporciona
  if (subCajaId && metodosFiltrados) {
    metodosFiltrados = metodosFiltrados.filter((metodo: any) => {
      return metodo.sub_caja_id === subCajaId
    })
  }

  // Filtrar por tipo de método de pago si se proporciona
  if (filterByTipo && metodosFiltrados) {
    metodosFiltrados = metodosFiltrados.filter((metodo: any) => {
      const tipo = metodo.tipo?.toLowerCase()
      
      // Si filterByTipo es un array, verificar si el tipo está en el array
      if (Array.isArray(filterByTipo)) {
        return filterByTipo.some(t => tipo === t.toLowerCase())
      }
      
      // Si es un string, comparar directamente
      return tipo === filterByTipo.toLowerCase()
    })
  }

  // Crear opciones con el formato: SubCaja/Banco/Método/Titular
  const options = metodosFiltrados?.map((metodo: any) => ({
    value: metodo.value,
    label: metodo.label,
  })) || []

  console.log('🔍 Opciones finales para el select:', options)

  return (
    <SelectBase
      showSearch
      prefix={<FaMoneyCheckAlt className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={options}
      onFocus={() => {
        if (!shouldFetch) {
          setShouldFetch(true)
        }
      }}
      onOpenChange={(open) => {
        if (open && !shouldFetch) {
          setShouldFetch(true)
        }
      }}
      {...props}
    />
  )
}
