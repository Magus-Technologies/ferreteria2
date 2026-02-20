'use client'

import { useQuery } from '@tanstack/react-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { catalogosGeneralesApi } from '~/lib/api/catalogos-generales'
import { FaUserShield } from 'react-icons/fa6'

interface SelectRolSistemaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectRolSistema({
  placeholder = 'Seleccionar Rol',
  variant = 'filled',
  classNameIcon = 'text-purple-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectRolSistemaProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['catalogos', 'roles-sistema'],
    queryFn: async () => {
      const response = await catalogosGeneralesApi.getRolesSistema()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos
  })

  return (
    <SelectBase
      showSearch
      prefix={<FaUserShield className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      options={data?.map(item => ({
        value: item.codigo,
        label: item.descripcion,
      }))}
      {...props}
    />
  )
}
