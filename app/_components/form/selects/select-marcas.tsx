'use client'

import { useQuery } from '@tanstack/react-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { TbBrand4Chan } from 'react-icons/tb'
import { marcasApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonCreateMarca from '../buttons/button-create-marca'
import { useRef } from 'react'
import iterarChangeValue from '~/app/_utils/iterar-change-value'

interface SelectMarcasProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
  // Si se pasa, el dropdown se acota a las marcas que tienen productos en estas categorías.
  categoriaIds?: number[]
}

export default function SelectMarcas({
  placeholder = 'Seleccionar Marca',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  categoriaIds,
  ...props
}: SelectMarcasProps) {
  const selectMarcasRef = useRef<RefSelectBaseProps>(null)

  const categoriaIdsKey = (categoriaIds ?? []).slice().sort((a, b) => a - b)

  const { data } = useQuery({
    queryKey: [QueryKeys.MARCAS, categoriaIdsKey],
    queryFn: async () => {
      const response = categoriaIdsKey.length > 0
        ? await marcasApi.getByCategorias(categoriaIdsKey)
        : await marcasApi.getAll()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  return (
    <>
      <SelectBase
        ref={selectMarcasRef}
        showSearch
        prefix={<TbBrand4Chan className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={data?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
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
