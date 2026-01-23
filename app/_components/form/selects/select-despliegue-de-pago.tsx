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
}

export default function SelectDespliegueDePago({
  placeholder = 'Método de Pago',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  tipoComprobante,
  ...props
}: SelectDespliegueDePagoProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filtrar métodos por tipo de comprobante si se proporciona
  const metodosFiltrados = tipoComprobante
    ? data?.filter((metodo: any) => metodo.tipos_comprobante.includes(tipoComprobante))
    : data

  // Crear opciones con el formato: SubCaja/Banco/Método/Titular
  const options = metodosFiltrados?.map((metodo: any) => ({
    value: metodo.value,
    label: metodo.label,
  })) || []

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
