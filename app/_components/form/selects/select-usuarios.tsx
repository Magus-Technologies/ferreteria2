'use client'

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
  const { response } = useServerQuery({
    action: getUsuarios,
    propsQuery: {
      queryKey: [QueryKeys.USUARIOS],
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
        {...props}
      />
    </>
  )
}
