'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { useLazyServerQuery } from '~/hooks/use-lazy-server-query'
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
  const { response, triggerFetch, isFetched } = useLazyServerQuery({
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
      onFocus={() => {
        if (!isFetched) {
          triggerFetch()
        }
      }}
      onOpenChange={(open) => {
        if (open && !isFetched) {
          triggerFetch()
        }
      }}
      {...props}
    />
  )
}
