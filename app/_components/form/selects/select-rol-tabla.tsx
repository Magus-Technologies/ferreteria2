'use client'

import { useQuery } from '@tanstack/react-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { permissionsApi } from '~/lib/api/permissions'
import { FaUserShield } from 'react-icons/fa6'

interface SelectRolTablaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

/**
 * Select de roles que lee la tabla `role` (no la lista hardcodeada).
 * El valor es el `role.id`. Solo muestra roles activos.
 */
export default function SelectRolTabla({
  placeholder = 'Seleccionar Rol',
  variant = 'filled',
  classNameIcon = 'text-purple-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectRolTablaProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['roles-gestion', 'select'],
    queryFn: async () => {
      const res = await permissionsApi.getRolesGestion()
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  const options = (data ?? [])
    .filter(rol => rol.estado !== false)
    .map(rol => ({
      value: rol.id,
      // Mostrar solo el nombre del rol de sistema
      label: rol.name,
    }))

  return (
    <SelectBase
      showSearch
      prefix={<FaUserShield className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      options={options}
      {...props}
    />
  )
}
