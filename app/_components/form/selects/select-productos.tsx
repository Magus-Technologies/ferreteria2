/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import {
  Marca,
  Prisma,
  Producto,
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  UnidadDerivada,
} from '@prisma/client'
import { SearchProductos } from '~/app/_actions/producto'
import { FaBoxOpen, FaSearch } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import ModalProductoSearch from '../../modals/modal-producto-search'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonCreateProductoPlus from '../buttons/button-create-producto-plus'
import SelectTipoBusquedaProducto, {
  TipoBusquedaProducto,
} from './select-tipo-busqueda-producto'

export function getFiltrosPorTipoBusqueda({
  tipoBusqueda,
  value,
}: {
  tipoBusqueda: TipoBusquedaProducto
  value: string
}): Prisma.ProductoWhereInput {
  const filtros = {
    [TipoBusquedaProducto.CODIGO_DESCRIPCION]: {
      OR: [
        {
          name: {
            contains: value,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          cod_producto: {
            contains: value,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    },
    [TipoBusquedaProducto.CODIGO_BARRAS]: {
      cod_barra: value,
    },
    [TipoBusquedaProducto.ACCION_TECNICA]: {
      accion_tecnica: {
        contains: value,
        mode: Prisma.QueryMode.insensitive,
      },
    },
  }

  return filtros[tipoBusqueda]
}

export type ProductoSelect = Pick<
  Producto,
  'id' | 'name' | 'cod_producto' | 'unidades_contenidas'
> & {
  marca: Marca
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
  classIconSearch?: string
  classNameTipoBusqueda?: string
  classIconPlus?: string
  withSearch?: boolean
  withTipoBusqueda?: boolean
  handleOnlyOneResult?: (producto: ProductoSelect) => void
}

export default function SelectProductos({
  placeholder,
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  onChange,
  optionsDefault = [],
  showButtonCreate = false,
  classIconSearch = '',
  classNameTipoBusqueda = '!min-w-[180px] !w-[180px] !max-w-[180px]',
  classIconPlus = '',
  withSearch = false,
  withTipoBusqueda = false,
  handleOnlyOneResult,
  ...props
}: SelectProductosProps) {
  const selectProductoRef = useRef<RefSelectBaseProps>(null)

  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    store => store.producto
  )
  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    store => store.setProducto
  )

  useEffect(() => {
    setProductoSeleccionadoSearchStore(undefined)
  }, [])

  const [openModalProductoSearch, setOpenModalProductoSearch] = useState(false)

  const [text, setText] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  const [textDefault, setTextDefault] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusquedaProducto>(
    TipoBusquedaProducto.CODIGO_DESCRIPCION
  )
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const [productoCreado, setProductoCreado] = useState<Producto>()
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<ProductoSelect>()

  const { response, refetch, loading } = useServerQuery({
    action: SearchProductos,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS_SEARCH],
      enabled: !!text,
    },
    params: {
      where: { ...getFiltrosPorTipoBusqueda({ tipoBusqueda, value: text }) },
      select: {
        id: true,
        name: true,
        cod_producto: true,
        unidades_contenidas: true,
        marca: true,
        producto_en_almacenes: {
          where: { almacen_id },
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

  function handleSearch() {
    if (text) {
      setProductoCreado(undefined)
      setProductoSeleccionado(undefined)
      refetch()
    }
  }

  useEffect(() => {
    handleSearch()
  }, [tipoBusqueda])

  useEffect(() => {
    if (response?.length === 1)
      handleOnlyOneResult?.(response[0] as unknown as ProductoSelect)
    else if ((response?.length ?? 0) > 1) setOpenModalProductoSearch(true)
  }, [response])

  function handleSelect({ data }: { data?: ProductoSelect } = {}) {
    const producto = data || productoSeleccionadoSearchStore
    if (producto) {
      setProductoSeleccionado(producto)
      iterarChangeValue({
        refObject: selectProductoRef,
        value: producto.id,
      })
      setProductoSeleccionadoSearchStore(undefined)
      setOpenModalProductoSearch(false)
    }
  }

  return (
    <>
      {withTipoBusqueda && (
        <SelectTipoBusquedaProducto
          className={classNameTipoBusqueda}
          size={props.size}
          onChange={setTipoBusqueda}
          value={tipoBusqueda}
        />
      )}
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
        loading={loading}
        variant={variant}
        placeholder={
          placeholder ||
          tipoBusqueda === TipoBusquedaProducto.CODIGO_DESCRIPCION
            ? 'Buscar Producto por Código o Descripción'
            : tipoBusqueda === TipoBusquedaProducto.CODIGO_BARRAS
            ? 'Buscar Producto por Código de Barras'
            : 'Buscar Producto por Acción Técnica'
        }
        options={[
          ...optionsDefault,
          ...(response?.map(item => ({
            value: item.id,
            label: `${item.cod_producto} : ${item.name}`,
          })) || []),

          ...(productoCreado
            ? [
                {
                  value: productoCreado.id,
                  label: `${productoCreado.cod_producto} : ${productoCreado.name}`,
                },
              ]
            : []),

          ...(productoSeleccionado
            ? [
                {
                  value: productoSeleccionado.id,
                  label: `${productoSeleccionado.cod_producto} : ${productoSeleccionado.name}`,
                },
              ]
            : []),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onKeyUp={e => {
          if (e.key === 'Enter') handleSearch()
        }}
        open={false}
        {...props}
      />
      {withSearch && (
        <FaSearch
          className={`text-yellow-600 mb-7 cursor-pointer min-w-fit ${classIconSearch}`}
          size={15}
          onClick={() => setOpenModalProductoSearch(true)}
        />
      )}
      <ModalProductoSearch
        open={openModalProductoSearch}
        setOpen={setOpenModalProductoSearch}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
        tipoBusqueda={tipoBusqueda}
        setTipoBusqueda={setTipoBusqueda}
      />
      {showButtonCreate && (
        <ButtonCreateProductoPlus
          onSuccess={res => {
            setProductoCreado(res)
            iterarChangeValue({
              refObject: selectProductoRef,
              value: res.id,
            })
          }}
          textDefault={textDefault}
          setTextDefault={setTextDefault}
          className={classIconPlus}
        />
      )}
    </>
  )
}
