'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getEgresosDinero } from '~/app/_actions/egreso-dinero'
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
  const { response } = useServerQuery({
    action: getEgresosDinero,
    propsQuery: {
      queryKey: [QueryKeys.EGRESOS_DINERO],
    },
    params: {
      where: {
        vuelto: null,
      },
    },
  })

  return (
    <SelectBase
      showSearch
      prefix={<GiPayMoney className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={response?.map(item => ({
        value: item.id,
        label: `${toLocalString({
          date: dayjs(item.createdAt),
        })} | S/. ${Number(item.monto).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      }))}
      {...props}
    />
  )
}
