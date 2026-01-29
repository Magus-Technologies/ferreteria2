'use client'

import { FormInstance, FormListFieldData } from 'antd'
import { StoreValue } from 'antd/es/form/interface'
import type { FormCreateCotizacion } from '../../_types/cotizacion.types'
import TableBase from '~/components/tables/table-base'
import { useColumnsCotizar, calcularSubtotalCotizacion } from './columns-cotizar'
import { useStoreProductoAgregadoCotizacion, ProductoCotizacionConUnidades } from '../../_store/store-producto-agregado-cotizacion'
import { useEffect } from 'react'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'

function condicionEditarProductoCotizacion({
  producto,
  item,
}: {
  producto: ProductoCotizacionConUnidades
  item: ProductoCotizacionConUnidades
}) {
  return (
    item.producto_id === producto.producto_id &&
    item.unidad_derivada_id === producto.unidad_derivada_id
  )
}

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

  function agregarProducto({
    producto,
  }: {
    producto: ProductoCotizacionConUnidades
  }) {
    const subtotal = calcularSubtotalCotizacion({
      precio_venta: producto.precio_venta || 0,
      recargo: producto.recargo || 0,
      cantidad: producto.cantidad || 0,
      descuento: producto.descuento || 0,
      descuento_tipo: producto.descuento_tipo || 'Monto',
    })

    add({
      ...producto,
      subtotal: Number(subtotal)
    })
  }

  useEffect(() => {
    if (productoAgregado && productoAgregado.producto_id) {
      // Agregar al store si no existe
      if (
        !productosStore.find(
          (item) => item.producto_id === productoAgregado.producto_id
        )
      ) {
        setProductosStore((prev) => [...prev, productoAgregado])
      }

      const productos = (form.getFieldValue('productos') ||
        []) as FormCreateCotizacion['productos']

      const producto_existente = productos.find(
        (item) => item.producto_id === productoAgregado.producto_id
      )

      if (!producto_existente) {
        agregarProducto({ producto: productoAgregado })
        setProductoAgregado(undefined)
        return
      }

      // Verificar si existe el mismo producto con la misma unidad derivada
      const producto_unidad_derivada_existente = productos.find((item) =>
        condicionEditarProductoCotizacion({
          producto: productoAgregado,
          item,
        })
      )

      if (producto_unidad_derivada_existente) {
        const index = productos.findIndex((item) =>
          condicionEditarProductoCotizacion({
            producto: productoAgregado,
            item,
          })
        )

        if (index <= -1) {
          setProductoAgregado(undefined)
          return
        }

        // Incrementar la cantidad
        const nueva_cantidad =
          Number(productoAgregado.cantidad) +
          Number(producto_unidad_derivada_existente.cantidad)

        const nuevo_subtotal = calcularSubtotalCotizacion({
          precio_venta: productoAgregado.precio_venta || 0,
          recargo: productoAgregado.recargo || 0,
          cantidad: nueva_cantidad,
          descuento: productoAgregado.descuento || 0,
          descuento_tipo: productoAgregado.descuento_tipo || 'Monto',
        })

        // Actualizar en el store
        setProductosStore((prev) =>
          prev.map((item) => {
            return condicionEditarProductoCotizacion({
              producto: productoAgregado,
              item,
            })
              ? {
                  ...productoAgregado,
                  cantidad: nueva_cantidad,
                  subtotal: Number(nuevo_subtotal),
                }
              : item
          })
        )

        // Actualizar en el formulario
        form.setFieldValue(
          'productos',
          productos.map((item, i) =>
            i === index
              ? {
                  ...productoAgregado,
                  cantidad: nueva_cantidad,
                  subtotal: Number(nuevo_subtotal),
                }
              : item
          )
        )
      } else {
        agregarProducto({ producto: productoAgregado })
      }

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
