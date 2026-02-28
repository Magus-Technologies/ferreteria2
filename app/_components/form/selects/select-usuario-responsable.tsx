'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { useQuery } from '@tanstack/react-query'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { FaUser } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface SelectUsuarioResponsableProps extends Omit<SelectBaseProps, 'placeholder' | 'variant'> {
  classNameIcon?: string
  sizeIcon?: number
  sinCaja?: boolean
  placeholder?: string
  variant?: 'filled' | 'outlined' | 'borderless'
}

export default function SelectUsuarioResponsable({
  placeholder = 'Selecciona un responsable',
  variant = 'filled',
  classNameIcon = 'text-blue-600 mx-1',
  sizeIcon = 14,
  sinCaja = true,
  ...props
}: SelectUsuarioResponsableProps) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENDEDORES_DISPONIBLES, sinCaja],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getVendedoresDisponibles({
        sin_caja: sinCaja,
      })
      return response.data?.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return (
    <SelectBase
      showSearch
      prefix={<FaUser className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      options={data?.map((usuario) => ({
        value: usuario.id,
        label: `${usuario.name} - ${usuario.numero_documento || usuario.email}`,
      }))}
      filterOption={(input, option) =>
        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...props}
    />
  )
}
