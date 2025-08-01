'use client'

import { FaWeightHanging } from 'react-icons/fa'
import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useServerQuery } from '~/hooks/use-server-query'
import { getUnidadesMedida } from '~/app/_actions/unidadMedida'
import ButtonCreateUnidadMedida from '../buttons/button-create-unidad-medida'

interface SelectUnidadDeMedidaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectUnidadDeMedida({
  placeholder = 'Unidad de Medida',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  showButtonCreate = false,
  ...props
}: SelectUnidadDeMedidaProps) {
  const { response } = useServerQuery({
    action: getUnidadesMedida,
    propsQuery: {
      queryKey: [QueryKeys.UNIDADES_MEDIDA],
    },
    params: undefined,
  })
  return (
    <>
      <SelectBase
        {...props}
        prefix={<FaWeightHanging className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
      />
      {showButtonCreate && <ButtonCreateUnidadMedida />}
    </>
  )
}
