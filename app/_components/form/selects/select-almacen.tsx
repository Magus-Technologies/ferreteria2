'use client'

import { PiWarehouseFill } from 'react-icons/pi'
import SelectBase, { SelectBaseProps } from './select-base'
import { useServerQuery } from '~/hooks/use-server-query'
import { getAlmacenes } from '~/app/_actions/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface SelectAlmacenProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectAlmacen({
  placeholder = 'Seleccionar Almacén',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-2',
  sizeIcon = 20,
  className = 'min-w-[300px]',
  size = 'large',
  ...props
}: SelectAlmacenProps) {
  const { response } = useServerQuery({
    action: getAlmacenes,
    propsQuery: {
      queryKey: [QueryKeys.ALMACENES],
    },
    params: undefined,
  })
  return (
    <SelectBase
      {...props}
      prefix={<PiWarehouseFill className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      className={className}
      size={size}
      options={response?.map(item => ({
        value: item.id,
        label: item.name,
      }))}
    />
  )
}
