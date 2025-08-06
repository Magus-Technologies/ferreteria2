'use client'

import { FaWeightHanging } from 'react-icons/fa'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useServerQuery } from '~/hooks/use-server-query'
import { getUnidadesMedida } from '~/app/_actions/unidadMedida'
import ButtonCreateUnidadMedida from '../buttons/button-create-unidad-medida'
import { useRef } from 'react'
import iterarChangeValue from '~/app/_utils/iterar-change-value'

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
  const selectUnidadDeMedidaRef = useRef<RefSelectBaseProps>(null)

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
        ref={selectUnidadDeMedidaRef}
        showSearch
        prefix={<FaWeightHanging className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
        {...props}
      />
      {showButtonCreate && (
        <ButtonCreateUnidadMedida
          onSuccess={res =>
            iterarChangeValue({
              refObject: selectUnidadDeMedidaRef,
              value: res.id,
            })
          }
        />
      )}
    </>
  )
}
