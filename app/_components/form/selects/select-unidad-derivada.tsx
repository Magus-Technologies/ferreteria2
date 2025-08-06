'use client'

import { FaWeightHanging } from 'react-icons/fa'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useServerQuery } from '~/hooks/use-server-query'
import { getUnidadesDerivadas } from '~/app/_actions/unidadDerivada'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonCreateUnidadDerivada from '../buttons/button-create-unidad-derivada'
import { useRef } from 'react'
import iterarChangeValue from '~/app/_utils/iterar-change-value'

interface SelectUnidadDerivadaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectUnidadDerivada({
  placeholder = 'Unidad Derivada',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  showButtonCreate = false,
  ...props
}: SelectUnidadDerivadaProps) {
  const selectUnidadDerivadaRef = useRef<RefSelectBaseProps>(null)

  const { response } = useServerQuery({
    action: getUnidadesDerivadas,
    propsQuery: {
      queryKey: [QueryKeys.UNIDADES_DERIVADAS],
    },
    params: undefined,
  })

  return (
    <>
      <SelectBase
        ref={selectUnidadDerivadaRef}
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
        <ButtonCreateUnidadDerivada
          onSuccess={res =>
            iterarChangeValue({
              refObject: selectUnidadDerivadaRef,
              value: res.id,
            })
          }
          className='!mb-0 ml-2'
        />
      )}
    </>
  )
}
