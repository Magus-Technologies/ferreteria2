'use client'

import { useQuery } from '@tanstack/react-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { usuariosApi } from '~/lib/api/usuarios'
import { FaUser } from 'react-icons/fa6'

interface SelectUsuariosProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectUsuarios({
  placeholder = 'Seleccionar Usuario',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectUsuariosProps) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.USUARIOS],
    queryFn: async () => {
      const response = await usuariosApi.getAll()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })

  return (
    <>
      <SelectBase
        showSearch
        prefix={<FaUser className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        loading={isLoading}
        options={data?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
        {...props}
      />
    </>
  )
}
