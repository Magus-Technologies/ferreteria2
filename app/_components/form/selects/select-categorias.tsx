'use client'

import { BiSolidCategoryAlt } from 'react-icons/bi'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useLazyServerQuery } from '~/hooks/use-lazy-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getCategorias } from '~/app/_actions/categoria'
import ButtonCreateCategoria from '../buttons/button-create-categoria'
import { useRef } from 'react'
import iterarChangeValue from '~/app/_utils/iterar-change-value'

interface SelectCategoriasProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectCategorias({
  placeholder = 'Seleccionar Categoría',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  ...props
}: SelectCategoriasProps) {
  const selectCategoriasRef = useRef<RefSelectBaseProps>(null)

  const { response, triggerFetch, isFetched } = useLazyServerQuery({
    action: getCategorias,
    propsQuery: {
      queryKey: [QueryKeys.CATEGORIAS],
    },
    params: undefined,
  })

  return (
    <>
      <SelectBase
        ref={selectCategoriasRef}
        showSearch
        prefix={
          <BiSolidCategoryAlt className={classNameIcon} size={sizeIcon} />
        }
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
        <ButtonCreateCategoria
          onSuccess={res =>
            iterarChangeValue({
              refObject: selectCategoriasRef,
              value: res.id,
            })
          }
        />
      )}
    </>
  )
}
