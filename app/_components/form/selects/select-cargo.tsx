'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { catalogosGeneralesApi } from '~/lib/api/catalogos-generales'
import { FaBriefcase } from 'react-icons/fa6'

interface SelectCargoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectCargo({
  placeholder = 'Seleccionar Cargo',
  variant = 'filled',
  classNameIcon = 'text-blue-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectCargoProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['catalogos', 'cargos'],
    queryFn: async () => {
      const response = await catalogosGeneralesApi.getCargos()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos
    enabled: shouldFetch,
  })

  return (
    <SelectBase
      showSearch
      prefix={<FaBriefcase className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      options={data?.map(item => ({
        value: item.codigo,
        label: item.descripcion,
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
