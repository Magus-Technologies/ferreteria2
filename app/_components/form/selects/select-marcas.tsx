'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { TbBrand4Chan } from 'react-icons/tb'
import { getMarcas } from '~/app/_actions/marca'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonCreateMarca from '../buttons/button-create-marca'

interface SelectMarcasProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectMarcas({
  placeholder = 'Seleccionar Marca',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  ...props
}: SelectMarcasProps) {
  const { response } = useServerQuery({
    action: getMarcas,
    propsQuery: {
      queryKey: [QueryKeys.MARCAS],
    },
    params: undefined,
  })
  return (
    <>
      <SelectBase
        {...props}
        prefix={<TbBrand4Chan className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
      />
      {showButtonCreate && <ButtonCreateMarca />}
    </>
  )
}
