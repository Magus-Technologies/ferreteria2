'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getTiposIngresoSalida } from '~/app/_actions/tipos-ingreso-salida'
import { FaCheckSquare } from 'react-icons/fa'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { useRef } from 'react'
import ButtonCreateTiposIngresoSalida from '../buttons/button-create-tipos-ingreso-salida'

interface SelectTiposIngresoSalidaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectTiposIngresoSalida({
  placeholder = 'Seleccionar Tipo',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  ...props
}: SelectTiposIngresoSalidaProps) {
  const selectTiposIngresoSalidaRef = useRef<RefSelectBaseProps>(null)

  const { response } = useServerQuery({
    action: getTiposIngresoSalida,
    propsQuery: {
      queryKey: [QueryKeys.TIPOS_INGRESO_SALIDA],
    },
    params: undefined,
  })

  return (
    <>
      <SelectBase
        ref={selectTiposIngresoSalidaRef}
        showSearch
        prefix={<FaCheckSquare className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
        {...props}
      />
      {showButtonCreate && (
        <ButtonCreateTiposIngresoSalida
          onSuccess={res =>
            iterarChangeValue({
              refObject: selectTiposIngresoSalidaRef,
              value: res.id,
            })
          }
        />
      )}
    </>
  )
}
