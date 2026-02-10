'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { catalogosGeneralesApi } from '~/lib/api/catalogos-generales'
import { FaHeart } from 'react-icons/fa6'

interface SelectEstadoCivilProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectEstadoCivil({
  placeholder = 'Seleccionar Estado Civil',
  variant = 'filled',
  classNameIcon = 'text-pink-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectEstadoCivilProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['catalogos', 'estados-civiles'],
    queryFn: async () => {
      const response = await catalogosGeneralesApi.getEstadosCiviles()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos (catálogo estable)
    enabled: shouldFetch,
  })

  return (
    <SelectBase
      showSearch
      prefix={<FaHeart className={classNameIcon} size={sizeIcon} />}
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
