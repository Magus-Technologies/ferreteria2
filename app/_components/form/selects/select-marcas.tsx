'use client'

import { useLazyServerQuery } from '~/hooks/use-lazy-server-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { TbBrand4Chan } from 'react-icons/tb'
import { getMarcas } from '~/app/_actions/marca'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonCreateMarca from '../buttons/button-create-marca'
import { useRef } from 'react'
import iterarChangeValue from '~/app/_utils/iterar-change-value'

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
  const selectMarcasRef = useRef<RefSelectBaseProps>(null)

  const { response, triggerFetch, isFetched } = useLazyServerQuery({
    action: getMarcas,
    propsQuery: {
      queryKey: [QueryKeys.MARCAS],
    },
    params: undefined,
  })

  return (
    <>
      <SelectBase
        ref={selectMarcasRef}
        showSearch
        prefix={<TbBrand4Chan className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
        onFocus={() => {
          if (!isFetched) {
            triggerFetch()
          }
        }}
        onOpenChange={(open) => {
          if (open && !isFetched) {
            triggerFetch()
          }
        }}
        {...props}
      />
      {showButtonCreate && (
        <ButtonCreateMarca
          onSuccess={res =>
            iterarChangeValue({
              refObject: selectMarcasRef,
              value: res.id,
            })
          }
        />
      )}
    </>
  )
}
