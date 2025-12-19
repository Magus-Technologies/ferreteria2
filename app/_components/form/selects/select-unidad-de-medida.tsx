'use client'

import { FaWeightHanging } from 'react-icons/fa'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { unidadesMedidaApi } from '~/lib/api/catalogos'
import ButtonCreateUnidadMedida from '../buttons/button-create-unidad-medida'
import { useRef, useState } from 'react'
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
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data } = useQuery({
    queryKey: [QueryKeys.UNIDADES_MEDIDA],
    queryFn: async () => {
      const response = await unidadesMedidaApi.getAll()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  return (
    <>
      <SelectBase
        ref={selectUnidadDeMedidaRef}
        showSearch
        prefix={<FaWeightHanging className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={data?.map(item => ({
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
