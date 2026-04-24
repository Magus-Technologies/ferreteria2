'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { apiRequest } from '~/lib/api'
import { formatFechaPeru } from '~/utils/fechas'
import { GiPayMoney } from 'react-icons/gi'

export interface GastoExtraDisponible {
  id: string
  monto: string
  concepto: string
  created_at: string
  user?: { id: string; name: string }
  despliegue_pago?: {
    metodo_de_pago?: { name: string }
  }
}

interface SelectEgresosDineroProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  excluirCompraId?: string
  onSelectGasto?: (gasto: GastoExtraDisponible | undefined) => void
}

export default function SelectEgresosDinero({
  placeholder = 'Egreso Asociado',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  excluirCompraId,
  onSelectGasto,
  ...props
}: SelectEgresosDineroProps) {
  const { data = [] } = useQuery({
    queryKey: [QueryKeys.EGRESOS_DINERO, excluirCompraId],
    queryFn: async () => {
      const response = await apiRequest<{ success: boolean; data: GastoExtraDisponible[] }>(
        '/gastos-extras/disponibles',
        { params: excluirCompraId ? { excluir_compra_id: excluirCompraId } : undefined }
      )
      return response.data?.data || []
    },
    staleTime: 0,
    retry: false,
    throwOnError: false,
  })

  return (
    <SelectBase
      showSearch
      prefix={<GiPayMoney className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      optionFilterProp="label"
      options={data.map(item => ({
        value: item.id,
        label: `${formatFechaPeru(item.created_at, 'DD/MM/YY')} | ${item.concepto} | S/. ${Number(item.monto).toFixed(2)}`,
      }))}
      onChange={(value, option) => {
        if (onSelectGasto) {
          const gasto = value ? data.find(g => g.id === value) : undefined
          onSelectGasto(gasto)
        }
        props.onChange?.(value, option)
      }}
      {...props}
    />
  )
}
