import TableBase from '~/components/tables/table-base'
import { FormInstance } from 'antd/lib'
import { FormListFieldData } from 'antd'
import { StoreValue } from 'antd/es/form/interface'
import { useColumnsVender } from './columns-vender'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'
import {
  useStoreProductoAgregadoVenta,
  ValuesCardAgregarProductoVenta,
} from '../../_store/store-producto-agregado-venta'
import { useEffect } from 'react'
import { FormCreateVenta } from '../others/body-vender'

function condicionEditarProductoVenta({
  producto,
  item,
}: {
  producto: ValuesCardAgregarProductoVenta
  item: ValuesCardAgregarProductoVenta
}) {
  return (
    item.producto_id === producto.producto_id &&
    item.unidad_derivada_id === producto.unidad_derivada_id
  )
}

export default function TableVender({
  form,
  fields,
  remove,
  add,
  cantidad_pendiente = false,
  venta,
}: {
  form: FormInstance
  fields: FormListFieldData[]
  remove: (index: number | number[]) => void
  add: (defaultValue?: StoreValue, insertIndex?: number) => void
  cantidad_pendiente?: boolean
  venta?: VentaConUnidadDerivadaNormal
}) {
  const productoAgregadoVentaStore = useStoreProductoAgregadoVenta(
    (store) => store.productoAgregado
  )
  const productosVenta = useStoreProductoAgregadoVenta(
    (store) => store.productos
  )
  const setProductosVenta = useStoreProductoAgregadoVenta(
    (store) => store.setProductos
  )

  function agregarProducto({
    producto,
  }: {
    producto: ValuesCardAgregarProductoVenta
  }) {
    add({
      ...producto,
      subtotal: Number(
        (
          (Number(producto.precio_venta) + Number(producto.recargo ?? 0)) *
          Number(producto.cantidad)
        ).toFixed(2)
      ),
    })
  }

  useEffect(() => {
    const productoAgregadoVenta = { ...productoAgregadoVentaStore }
    if (
      productoAgregadoVenta &&
      Object.keys(productoAgregadoVenta).length &&
      productoAgregadoVenta.producto_id
    ) {
      if (
        !productosVenta.find(
          (item) => item.producto_id === productoAgregadoVenta.producto_id
        )
      )
        setProductosVenta((prev) => [...prev, productoAgregadoVenta])

      const productos = (form.getFieldValue('productos') ||
        []) as FormCreateVenta['productos']

      const producto_existente = productos.find(
        (item) => item.producto_id === productoAgregadoVenta.producto_id
      )
      if (!producto_existente) {
        agregarProducto({ producto: productoAgregadoVenta })
        return
      }

      const producto_unidad_derivada_existente = productos.find((item) =>
        condicionEditarProductoVenta({
          producto: productoAgregadoVenta,
          item,
        })
      )
      if (producto_unidad_derivada_existente) {
        const index = productos.findIndex((item) =>
          condicionEditarProductoVenta({
            producto: productoAgregadoVenta,
            item,
          })
        )

        if (index <= -1) return

        const nueva_cantidad =
          Number(productoAgregadoVenta.cantidad) +
          Number(producto_unidad_derivada_existente.cantidad)
        setProductosVenta((prev) =>
          prev.map((item) => {
            return condicionEditarProductoVenta({
              producto: productoAgregadoVenta,
              item,
            })
              ? {
                  ...productoAgregadoVenta,
                  cantidad: nueva_cantidad,
                  subtotal: Number(
                    (
                      (Number(productoAgregadoVenta.precio_venta) +
                        Number(productoAgregadoVenta.recargo ?? 0)) *
                      Number(nueva_cantidad)
                    ).toFixed(2)
                  ),
                }
              : item
          })
        )

        form.setFieldValue(
          'productos',
          productos.map((item, i) =>
            i === index
              ? {
                  ...productoAgregadoVenta,
                  cantidad: nueva_cantidad,
                  subtotal: Number(
                    (
                      (Number(productoAgregadoVenta.precio_venta) +
                        Number(productoAgregadoVenta.recargo ?? 0)) *
                      Number(nueva_cantidad)
                    ).toFixed(2)
                  ),
                }
              : item
          )
        )
      } else {
        agregarProducto({ producto: productoAgregadoVenta })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregadoVentaStore])

  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        className='h-full'
        rowSelection={false}
        rowData={fields}
        columnDefs={useColumnsVender({
          remove,
          form,
          cantidad_pendiente,
          venta,
        })}
      />
    </>
  )
}
