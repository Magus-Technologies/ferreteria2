'use client'

import { BiSolidCategoryAlt } from 'react-icons/bi'
import SelectBase, { SelectBaseProps } from './select-base'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getCategorias } from '~/app/_actions/categoria'

interface SelectCategoriasProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectCategorias({
  placeholder = 'Seleccionar Categoría',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectCategoriasProps) {
  const { response } = useServerQuery({
    action: getCategorias,
    propsQuery: {
      queryKey: [QueryKeys.CATEGORIAS],
    },
    params: undefined,
  })
  return (
    <SelectBase
      {...props}
      prefix={<BiSolidCategoryAlt className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={response?.map(item => ({
        value: item.id,
        label: item.name,
      }))}
    />
  )
}
