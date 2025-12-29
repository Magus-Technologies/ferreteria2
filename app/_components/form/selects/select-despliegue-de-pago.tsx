'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FaMoneyCheckAlt } from 'react-icons/fa'
import { despliegueDePagoApi, type DespliegueDePago } from '~/lib/api/despliegue-de-pago'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

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
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data } = useQuery({
    queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
    queryFn: async () => {
      const result = await despliegueDePagoApi.getAll({ mostrar: true })
      return result.data?.data || []
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return (
    <SelectBase
      showSearch
      prefix={<FaMoneyCheckAlt className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={data?.map((item: DespliegueDePago) => ({
        value: item.id,
        label: item.name,
      }))}
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
