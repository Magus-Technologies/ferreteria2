'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getGastos, type Gasto } from '~/lib/api/gastos'
import { toLocalString } from '~/utils/fechas'
import dayjs from 'dayjs'
import { GiPayMoney } from 'react-icons/gi'

interface SelectEgresosDineroProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectEgresosDinero({
  placeholder = 'Egreso Dinero',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  ...props
}: SelectEgresosDineroProps) {
  const { data } = useQuery({
    queryKey: [QueryKeys.EGRESOS_DINERO],
    queryFn: async () => {
      const response = await getGastos({ per_page: 100 })
      // Filtrar solo los que no tienen vuelto
      return response.data.filter((item: Gasto) => item.vuelto == null || item.vuelto === 0)
    },
    staleTime: 3 * 60 * 1000,
    retry: false,
    throwOnError: false,
  })

  return (
    <SelectBase
      showSearch
      prefix={<GiPayMoney className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={data?.map(item => ({
        value: item.id,
        label: `${toLocalString({
          date: dayjs(item.fecha),
        })} | S/. ${Number(item.monto).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      }))}
      {...props}
    />
  )
}
