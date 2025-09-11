'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import {
  Prisma,
  Producto,
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  UnidadDerivada,
} from '@prisma/client'
import { SearchProductos } from '~/app/_actions/producto'
import { FaBoxOpen } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'

export type ProductoSelect = Pick<
  Producto,
  'id' | 'name' | 'cod_producto' | 'unidades_contenidas'
> & {
  producto_en_almacenes: (Pick<
    ProductoAlmacen,
    'almacen_id' | 'costo' | 'stock_fraccion'
  > & {
    unidades_derivadas: (Pick<
      ProductoAlmacenUnidadDerivada,
      'id' | 'factor'
    > & {
      unidad_derivada: Pick<UnidadDerivada, 'id' | 'name'>
    })[]
  })[]
}

interface SelectProductosProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
  onChange?: (value: string, producto?: ProductoSelect) => void
  optionsDefault?: { value: number; label: string }[]
}

export default function SelectProductos({
  placeholder = 'Buscar Producto',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  onChange,
  optionsDefault = [],
  ...props
}: SelectProductosProps) {
  const [text, setText] = useState('')

  const [value] = useDebounce(text, 1000)

  const { response, refetch } = useServerQuery({
    action: SearchProductos,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS_SEARCH],
      enabled: !!value,
    },
    params: {
      where: {
        OR: [
          {
            name: {
              contains: value,
              mode: 'insensitive',
            },
          },
          {
            cod_producto: {
              contains: value,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        cod_producto: true,
        unidades_contenidas: true,
        producto_en_almacenes: {
          select: {
            almacen_id: true,
            costo: true,
            stock_fraccion: true,
            unidades_derivadas: {
              select: {
                id: true,
                factor: true,
                unidad_derivada: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.ProductoFindManyArgs,
  })

  useEffect(() => {
    if (value) refetch()
  }, [value, refetch])

  return (
    <>
      <SelectBase
        showSearch
        onChange={value => {
          const producto = response?.find(item => item.id === value) as
            | ProductoSelect
            | undefined
          onChange?.(value, producto)
        }}
        filterOption={false}
        onSearch={setText}
        prefix={<FaBoxOpen className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={[
          ...optionsDefault,
          ...(response?.map(item => ({
            value: item.id,
            label: `${item.cod_producto} : ${item.name}`,
          })) || []),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        {...props}
      />
    </>
  )
}
