'use client'

import { FormInstance, FormListFieldData } from 'antd'
import { StoreValue } from 'antd/es/form/interface'
import type { FormCreateCotizacion } from '../../_types/cotizacion.types'
import TableBase from '~/components/tables/table-base'
import { useColumnsCotizar, calcularSubtotalCotizacion } from './columns-cotizar'
import { useStoreProductoAgregadoCotizacion } from '../../_store/store-producto-agregado-cotizacion'
import { useEffect } from 'react'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'

export default function TableCotizar({
  form,
  fields,
  remove,
  add,
}: {
  form: FormInstance<FormCreateCotizacion>
  fields: FormListFieldData[]
  remove: (index: number | number[]) => void
  add: (defaultValue?: StoreValue, insertIndex?: number) => void
}) {
  const productoAgregado = useStoreProductoAgregadoCotizacion(
    (store) => store.productoAgregado
  )
  const setProductoAgregado = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductoAgregado
  )
  const productosStore = useStoreProductoAgregadoCotizacion(
    (store) => store.productos
  )
  const setProductosStore = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductos
  )

  useEffect(() => {
    if (productoAgregado) {
      // Calcular el subtotal antes de agregar
      const subtotal = calcularSubtotalCotizacion({
        precio_venta: productoAgregado.precio_venta || 0,
        recargo: productoAgregado.recargo || 0,
        cantidad: productoAgregado.cantidad || 0,
        descuento: productoAgregado.descuento || 0,
        descuento_tipo: productoAgregado.descuento_tipo || 'Monto',
      })

      // Producto con subtotal calculado
      const productoConSubtotal = {
        ...productoAgregado,
        subtotal: Number(subtotal)
      }

      // Agregar al store
      setProductosStore((prev) => [...prev, productoConSubtotal])
      
      // Agregar al formulario usando add
      add(productoConSubtotal)
      
      // Limpiar el producto agregado
      setProductoAgregado(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregado])

  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        className='h-full'
        rowSelection={false}
        rowData={fields}
        columnDefs={useColumnsCotizar({ form })}
        suppressCellFocus={true}
      />
    </>
  )
}
