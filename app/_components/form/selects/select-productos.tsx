/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { Prisma } from '@prisma/client'
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
  onChange?: (value: number, producto?: Producto) => void
  optionsDefault?: { value: number; label: string }[]
  classIconSearch?: string
  classNameTipoBusqueda?: string
  classIconPlus?: string
  withSearch?: boolean
  withTipoBusqueda?: boolean
  handleOnlyOneResult?: (producto: Producto) => void
  showCardAgregarProducto?: boolean
  showCardAgregarProductoVenta?: boolean
  showCardAgregarProductoCotizacion?: boolean
  showCardAgregarProductoPrestamo?: boolean
  showUltimasCompras?: boolean
  limpiarOnChange?: boolean
  autoFocus?: boolean
  selectionColor?: string // Color para la fila seleccionada en el modal
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
  autoFocus = false,
  selectionColor, // Recibir el color de selección
  ...props
}: SelectProductosProps) {
  const selectProductoRef = useRef<RefSelectBaseProps>(null)

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

  const [openModalProductoSearch, setOpenModalProductoSearch] = useState(false)

  const [text, setText] = useState('')

  const [textDefault, setTextDefault] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusquedaProducto>(
    TipoBusquedaProducto.CODIGO_DESCRIPCION
  )
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const [productoCreado, setProductoCreado] = useState<Producto>()
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto>()

  const { data: responseData, refetch, isLoading: loading, isFetching } = useQuery({
    queryKey: [QueryKeys.PRODUCTOS_SEARCH, text, tipoBusqueda, almacen_id],
    queryFn: async () => {
      if (!text || !almacen_id) return []
      
      const response = await productosApiV2.getAllByAlmacen({
        almacen_id,
        search: text,
        estado: 1,
        per_page: 100,
      })
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // response.data tiene la estructura { data: Producto[], ... }
      return response.data?.data || []
    },
    enabled: false, // Solo se ejecuta manualmente con refetch
  })

  // Renombrar para mayor claridad
  const productos = responseData

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
    // Solo abrir modal si hay resultados (significa que el usuario buscó algo)
    if (!productos || productos.length === 0) return

    if (productos.length === 1) handleOnlyOneResult?.(productos[0])
    else if (text) setOpenModalProductoSearch(true) // Solo abrir si hay texto de búsqueda
  }, [productos, isFetching])

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
              // Si withSearch está activo, abrir el modal de búsqueda
              setTextDefault(text)
              setOpenModalProductoSearch(true)
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
            setTextDefault(text)
            setOpenModalProductoSearch(true)
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
          showCardAgregarProductoVenta={showCardAgregarProductoVenta}
          showCardAgregarProductoCotizacion={showCardAgregarProductoCotizacion}
          showCardAgregarProductoPrestamo={showCardAgregarProductoPrestamo}
          showUltimasCompras={showUltimasCompras}
          selectionColor={colorSeleccion}
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
}
