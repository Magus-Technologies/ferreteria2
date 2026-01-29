'use client'

import { useState } from 'react'
import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getUsuarios } from '~/app/_actions/usuario'
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
  // Cargar datos solo cuando el usuario interactúe
  const [shouldFetch, setShouldFetch] = useState(false)

  const { response } = useServerQuery({
    action: getUsuarios,
    propsQuery: {
      queryKey: [QueryKeys.USUARIOS],
      staleTime: 5 * 60 * 1000, // Cache por 5 minutos
      enabled: shouldFetch, // Solo cargar cuando sea necesario
    },
    params: undefined,
  })

  return (
    <>
      <SelectBase
        showSearch
        prefix={<FaUser className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
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
    </>
  )
}
