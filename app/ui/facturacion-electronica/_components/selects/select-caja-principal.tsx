'use client'

import SelectBase, { SelectBaseProps } from '~/app/_components/form/selects/select-base'
import { useQuery } from '@tanstack/react-query'
import { cajaPrincipalApi, type CajaPrincipal } from '~/lib/api/caja-principal'
import { FaCashRegister } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useState } from 'react'

interface SelectCajaPrincipalProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  filterByUserId?: string
}

export default function SelectCajaPrincipal({
  placeholder = 'Selecciona una caja',
  variant = 'filled',
  classNameIcon = 'text-emerald-600 mx-1',
  sizeIcon = 14,
  filterByUserId,
  ...props
}: SelectCajaPrincipalProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.CAJAS_PRINCIPALES],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getAll()
      return response.data?.data || []
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filter by user if filterByUserId is provided
  const filteredData = filterByUserId 
    ? data?.filter((caja: CajaPrincipal) => caja.user.id === filterByUserId)
    : data

  return (
    <SelectBase
      showSearch
      prefix={<FaCashRegister className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      options={filteredData?.map((caja: CajaPrincipal) => ({
        value: caja.id,
        label: `${caja.codigo} - ${caja.nombre} (${caja.user.name})`,
      }))}
      filterOption={(input, option) =>
        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
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
