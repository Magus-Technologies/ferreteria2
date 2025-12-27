/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { Prisma } from '@prisma/client'
import type { Producto } from '~/app/_types/producto'
import {
  getProductosResponseProps,
  SearchProductos,
} from '~/app/_actions/producto'
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
          },
        },
        {
          cod_producto: {
            contains: value,
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
      },
    },
  }

  return filtros[tipoBusqueda]
}

interface SelectProductosProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
  onChange?: (value: number, producto?: getProductosResponseProps) => void
  optionsDefault?: { value: number; label: string }[]
  classIconSearch?: string
  classNameTipoBusqueda?: string
  classIconPlus?: string
  withSearch?: boolean
  withTipoBusqueda?: boolean
  handleOnlyOneResult?: (producto: getProductosResponseProps) => void
  showCardAgregarProducto?: boolean
  showCardAgregarProductoVenta?: boolean
  showCardAgregarProductoCotizacion?: boolean
  showCardAgregarProductoPrestamo?: boolean
  showUltimasCompras?: boolean
  limpiarOnChange?: boolean
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
  showCardAgregarProducto = false,
  showCardAgregarProductoVenta = false,
  showCardAgregarProductoCotizacion = false,
  showCardAgregarProductoPrestamo = false,
  limpiarOnChange = false,
  showUltimasCompras = true,
  ...props
}: SelectProductosProps) {
  const selectProductoRef = useRef<RefSelectBaseProps>(null)

  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  )
  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  )

  useEffect(() => {
    setProductoSeleccionadoSearchStore(undefined)
  }, [])

  const [openModalProductoSearch, setOpenModalProductoSearch] = useState(false)

  const [text, setText] = useState('')

  const [textDefault, setTextDefault] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusquedaProducto>(
    TipoBusquedaProducto.CODIGO_DESCRIPCION
  )
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const [productoCreado, setProductoCreado] = useState<Producto>()
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<getProductosResponseProps>()

  const { response, refetch, loading, isFetching } = useServerQuery({
    action: SearchProductos,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS_SEARCH],
      enabled: false,
    },
    params: {
      where: {
        ...getFiltrosPorTipoBusqueda({ tipoBusqueda, value: text }),
        producto_en_almacenes: { some: { almacen_id } },
        permitido: true,
        estado: true,
      },
    },
  })

  function handleSearch() {
    if (text) {
      setProductoCreado(undefined)
      setProductoSeleccionado(undefined)
      refetch()
    }
  }

  const primeraVez = useRef(true)

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false
      return
    }
    if (isFetching) return
    if (response?.length === 1) handleOnlyOneResult?.(response[0])
    else setOpenModalProductoSearch(true)
  }, [response, isFetching])

  function handleSelect({ data }: { data?: getProductosResponseProps } = {}) {
    const producto = data || productoSeleccionadoSearchStore
    if (producto) {
      setProductoSeleccionado(producto)
      iterarChangeValue({
        refObject: selectProductoRef,
        value: producto.id,
      })
      setProductoSeleccionadoSearchStore(undefined)
      setOpenModalProductoSearch(false)
      if (limpiarOnChange) setText('')
      onChange?.(producto.id, producto)
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
        ref={selectProductoRef}
        showSearch
        onClear={() => {
          setTextDefault('')
        }}
        onChange={(value) => {
          const producto = response?.find((item) => item.id === value) as
            | getProductosResponseProps
            | undefined
          onChange?.(value, producto)
        }}
        filterOption={false}
        onSearch={setText}
        searchValue={text}
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
          ...(response?.map((item) => ({
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
            self.findIndex((i) => i.value === item.value) === index
        )}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            setTextDefault(text)
            handleSearch()
          }
        }}
        open={false}
        {...props}
      />
      {withSearch && (
        <FaSearch
          className={`text-yellow-600 mb-7 cursor-pointer min-w-fit ${classIconSearch}`}
          size={15}
          onClick={() => {
            setTextDefault(text)
            setOpenModalProductoSearch(true)
          }}
        />
      )}
      <ModalProductoSearch
        open={openModalProductoSearch}
        setOpen={setOpenModalProductoSearch}
        textDefault={textDefault}
        setTextDefault={setTextDefault}
        onRowDoubleClicked={handleSelect}
        tipoBusqueda={tipoBusqueda}
        setTipoBusqueda={setTipoBusqueda}
        showCardAgregarProducto={showCardAgregarProducto}
        showCardAgregarProductoVenta={showCardAgregarProductoVenta}
        showCardAgregarProductoCotizacion={showCardAgregarProductoCotizacion}
        showCardAgregarProductoPrestamo={showCardAgregarProductoPrestamo}
        showUltimasCompras={showUltimasCompras}
      />
      {showButtonCreate && (
        <ButtonCreateProductoPlus
          onSuccess={(res) => {
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
