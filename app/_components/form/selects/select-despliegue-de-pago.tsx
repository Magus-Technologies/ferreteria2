'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getDespliegueDePago } from '~/app/_actions/despliegue-de-pago'
import { FaMoneyCheckAlt } from 'react-icons/fa'

interface SelectDespliegueDePagoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectDespliegueDePago({
  placeholder = 'Despliegue de Pago',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  ...props
}: SelectDespliegueDePagoProps) {
  const { response } = useServerQuery({
    action: getDespliegueDePago,
    propsQuery: {
      queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
    },
    params: {
      where: {
        mostrar: true,
      },
    },
  })

  return (
    <SelectBase
      showSearch
      prefix={<FaMoneyCheckAlt className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={response?.map(item => ({
        value: item.id,
        label: item.name,
      }))}
      {...props}
    />
  )
}
