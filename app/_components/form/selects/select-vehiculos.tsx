'use client'

import { useQuery } from '@tanstack/react-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { FaTruck } from 'react-icons/fa'
import { vehiculosApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface SelectVehiculosProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectVehiculos({
  placeholder = 'Seleccionar Vehículo',
  variant = 'filled',
  classNameIcon = 'text-orange-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectVehiculosProps) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VEHICULOS],
    queryFn: async () => {
      const response = await vehiculosApi.getAll({ estado: true })
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <SelectBase
      showSearch
      allowClear
      prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      options={data?.map(item => ({
        value: item.id,
        label: `${item.name}${item.placa ? ` (${item.placa})` : ''} - ${item.tipo}`,
      }))}
      {...props}
    />
  )
}
