/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'
import type { ProductoWhereInput } from '~/types'
import type { Producto } from '~/app/_types/producto'
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
import { usePathname } from 'next/navigation'
import { orangeColors, greenColors } from '~/lib/colors'
import { useQuery } from '@tanstack/react-query'
import { productosApiV2 } from '~/lib/api/producto'

export function getFiltrosPorTipoBusqueda({
  tipoBusqueda,
  value,
}: {
  tipoBusqueda: TipoBusquedaProducto
  value: string
}): ProductoWhereInput {
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
  onChange?: (value: number, producto?: Producto) => void
  optionsDefault?: { value: number; label: string }[]
  classIconSearch?: string
  classNameTipoBusqueda?: string
  classIconPlus?: string
  withSearch?: boolean
  withTipoBusqueda?: boolean
  handleOnlyOneResult?: (producto: Producto) => void
  showCardAgregarProducto?: boolean
  autoFillPrecioCompraWithCosto?: boolean
  showCardAgregarProductoVenta?: boolean
  showCardAgregarProductoCotizacion?: boolean
  showCardAgregarProductoPrestamo?: boolean
  showCardAgregarProductoGuia?: boolean
  showCardAgregarProductoTransferencia?: boolean
  almacenOrigenIdTransferencia?: number
  showUltimasCompras?: boolean
  limpiarOnChange?: boolean
  autoFocus?: boolean
  selectionColor?: string // Color para la fila seleccionada en el modal
}

export interface RefSelectProductosProps {
  focus: () => void
}

const SelectProductos = forwardRef<RefSelectProductosProps, SelectProductosProps>(function SelectProductos({
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
  autoFillPrecioCompraWithCosto = false,
  showCardAgregarProductoVenta = false,
  showCardAgregarProductoCotizacion = false,
  showCardAgregarProductoPrestamo = false,
  showCardAgregarProductoGuia = false,
  showCardAgregarProductoTransferencia = false,
  almacenOrigenIdTransferencia,
  limpiarOnChange = false,
  showUltimasCompras = true,
  autoFocus = false,
  selectionColor,
  onSearch,
  ...props
}, ref) {
  const selectProductoRef = useRef<RefSelectBaseProps>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      selectProductoRef.current?.focus()
    },
  }))

  const pathname = usePathname()
  // Detectar el color automáticamente si no se pasa como prop
  const colorSeleccion = selectionColor || (
    pathname?.includes('facturacion-electronica')
      ? orangeColors[10]
      : pathname?.includes('gestion-comercial-e-inventario')
      ? greenColors[10]
      : undefined
  )

  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  )
  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  )

  useEffect(() => {
    setProductoSeleccionadoSearchStore(undefined)
  }, [])

  // Aplicar autoFocus cuando el componente se monta
  useEffect(() => {
    if (autoFocus && selectProductoRef.current) {
      // Usar setTimeout para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        selectProductoRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const [openModalProductoSearch, _setOpenModalProductoSearch] = useState(false)

  // Wrapper: al cerrar el modal, limpiar buscador y devolver focus
  const setOpenModalProductoSearch = (open: boolean) => {
    _setOpenModalProductoSearch(open)
    if (!open) {
      setText('')
      setTextDefault('')
      setTimeout(() => {
        selectProductoRef.current?.focus()
      }, 300)
    }
  }

  const text = useStoreProductoSeleccionadoSearch(store => store.searchText)
  const setText = useStoreProductoSeleccionadoSearch(store => store.setSearchText)

  const [textDefault, setTextDefault] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusquedaProducto>(
    TipoBusquedaProducto.CODIGO_DESCRIPCION
  )
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const [productoCreado, setProductoCreado] = useState<Producto>()
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto>()

  const [debouncedText, { flush }] = useDebounce(text, 300)
  const [manualSearch, setManualSearch] = useState(false)

  const { data: responseData, refetch, isLoading: loading, isFetching } = useQuery({
    queryKey: [QueryKeys.PRODUCTOS_SEARCH, debouncedText, tipoBusqueda, almacen_id],
    queryFn: async () => {
      if (!debouncedText || !almacen_id) return []
      
      const response = await productosApiV2.getAllByAlmacen({
        almacen_id,
        search: debouncedText,
        estado: 1,
        per_page: 30,
      })
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // response.data tiene la estructura { data: Producto[], ... }
      return response.data?.data || []
    },
    enabled: !!debouncedText && !!almacen_id,
  })

  // Renombrar para mayor claridad
  const productos = responseData

  function handleSearch() {
    setTextDefault(text)
    setProductoCreado(undefined)

    if (text) {
      flush() // Sincronizar el texto debounced inmediatamente
      setManualSearch(true)
      refetch()
    } else {
      // Si no hay texto, abrir el modal directamente
      setOpenModalProductoSearch(true)
    }
  }

  const primeraVez = useRef(true)

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false
      return
    }
    if (manualSearch) {
      setManualSearch(false)
      if (productos && productos.length === 1) {
        handleOnlyOneResult?.(productos[0])
      } else {
        setOpenModalProductoSearch(true)
      }
    }
  }, [productos, isFetching, manualSearch])

  function handleSelect({ data }: { data?: Producto } = {}) {
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
        uppercase={true}
        onClear={() => {
          setText('')
          setTextDefault('')
        }}
        onChange={(value) => {
          const producto = productos?.find((item) => item.id === value)
          
          if (producto) {
            // Ejecutar handleOnlyOneResult si existe
            handleOnlyOneResult?.(producto)
          }
          
          onChange?.(value, producto)
        }}
        filterOption={false}
        onSearch={(val) => {
          setText(val)
          onSearch?.(val)
        }}
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
          ...(productos?.map((item) => ({
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
            if (withSearch) {
              handleSearch()
            } else {
              // Si withSearch está desactivado, seleccionar el primer resultado
              if (productos && productos.length > 0) {
                const primerProducto = productos[0]
                handleOnlyOneResult?.(primerProducto)
                onChange?.(primerProducto.id, primerProducto)
                // setText('') 
              }
            }
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
            handleSearch()
          }}
        />
      )}
      {withSearch && (
        <ModalProductoSearch
          open={openModalProductoSearch}
          setOpen={setOpenModalProductoSearch}
          textDefault={textDefault}
          setTextDefault={setTextDefault}
          onRowDoubleClicked={handleSelect}
          tipoBusqueda={tipoBusqueda}
          setTipoBusqueda={setTipoBusqueda}
          showCardAgregarProducto={showCardAgregarProducto}
          autoFillPrecioCompraWithCosto={autoFillPrecioCompraWithCosto}
          showCardAgregarProductoVenta={showCardAgregarProductoVenta}
          showCardAgregarProductoCotizacion={showCardAgregarProductoCotizacion}
          showCardAgregarProductoPrestamo={showCardAgregarProductoPrestamo}
          showCardAgregarProductoGuia={showCardAgregarProductoGuia}
          showCardAgregarProductoTransferencia={showCardAgregarProductoTransferencia}
          almacenOrigenIdTransferencia={almacenOrigenIdTransferencia}
          showUltimasCompras={showUltimasCompras}
          selectionColor={colorSeleccion}
          onAfterClose={() => {
            // Devolver focus al buscador después de cerrar el modal
            ;[0, 50, 150, 300, 500].forEach((delay) => {
              setTimeout(() => {
                selectProductoRef.current?.focus()
              }, delay)
            })
          }}
        />
      )}
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
})

export default SelectProductos
