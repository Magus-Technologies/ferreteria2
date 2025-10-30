import TableBase from '~/components/tables/table-base'
import { onChangeCostoTablaCompras, useColumnsComprar } from './columns-comprar'
import { FormInstance } from 'antd/lib'
import { FormListFieldData } from 'antd'
import { StoreValue } from 'antd/es/form/interface'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { ValuesCardAgregarProductoCompra } from '../cards/card-agregar-producto-compra'
import { FormCreateCompra } from '../others/body-comprar'

function condicionEditarProductoCompra({
  producto,
  item,
}: {
  producto: ValuesCardAgregarProductoCompra
  item: ValuesCardAgregarProductoCompra
}) {
  return (
    item.producto_id === producto.producto_id &&
    item.unidad_derivada_id === producto.unidad_derivada_id &&
    item.bonificacion === producto.bonificacion
  )
}

export default function TableComprar({
  form,
  fields,
  remove,
  add,
  incluye_precios = true,
  cantidad_pendiente = false,
}: {
  form: FormInstance
  fields: FormListFieldData[]
  remove: (index: number | number[]) => void
  add: (defaultValue?: StoreValue, insertIndex?: number) => void
  incluye_precios?: boolean
  cantidad_pendiente?: boolean
}) {
  const productoAgregadoCompraStore = useStoreProductoAgregadoCompra(
    store => store.productoAgregado
  )
  const productosCompra = useStoreProductoAgregadoCompra(
    store => store.productos
  )
  const setProductosCompra = useStoreProductoAgregadoCompra(
    store => store.setProductos
  )

  function agregarProducto({
    producto,
  }: {
    producto: ValuesCardAgregarProductoCompra
  }) {
    const length = fields.length
    add({
      ...producto,
      subtotal: Number(
        (Number(producto.precio_compra) * Number(producto.cantidad)).toFixed(2)
      ),
      vencimiento: producto.vencimiento
        ? dayjs(producto.vencimiento).local()
        : undefined,
    })
    if (!producto.bonificacion)
      onChangeCostoTablaCompras({
        form,
        value: length,
        costo: Number(producto.precio_compra ?? 0),
      })
  }

  useEffect(() => {
    const productoAgregadoCompra = { ...productoAgregadoCompraStore }
    if (
      productoAgregadoCompra &&
      Object.keys(productoAgregadoCompra).length &&
      productoAgregadoCompra.producto_id
    ) {
      if (
        !productosCompra.find(
          item => item.producto_id === productoAgregadoCompra.producto_id
        )
      )
        setProductosCompra(prev => [...prev, productoAgregadoCompra])

      if (productoAgregadoCompra.bonificacion)
        productoAgregadoCompra.producto_name = `🎁 ${productoAgregadoCompra.producto_name} (Bonificación)`

      const productos = (form.getFieldValue('productos') ||
        []) as FormCreateCompra['productos']

      const producto_existente = productos.find(
        item => item.producto_id === productoAgregadoCompra.producto_id
      )
      if (!producto_existente) {
        agregarProducto({ producto: productoAgregadoCompra })
        return
      }

      const producto_unidad_derivada_existente = productos.find(item =>
        condicionEditarProductoCompra({
          producto: productoAgregadoCompra,
          item,
        })
      )
      if (producto_unidad_derivada_existente) {
        const index = productos.findIndex(item =>
          condicionEditarProductoCompra({
            producto: productoAgregadoCompra,
            item,
          })
        )

        if (index <= -1) return

        const nueva_cantidad =
          Number(productoAgregadoCompra.cantidad) +
          Number(producto_unidad_derivada_existente.cantidad)
        setProductosCompra(prev =>
          prev.map(item => {
            return condicionEditarProductoCompra({
              producto: productoAgregadoCompra,
              item,
            })
              ? {
                  ...productoAgregadoCompra,
                  cantidad: nueva_cantidad,
                  subtotal: Number(
                    (
                      Number(productoAgregadoCompra.precio_compra) *
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
                  ...productoAgregadoCompra,
                  cantidad: nueva_cantidad,
                  subtotal: Number(
                    (
                      Number(productoAgregadoCompra.precio_compra) *
                      Number(nueva_cantidad)
                    ).toFixed(2)
                  ),
                  vencimiento: productoAgregadoCompra.vencimiento
                    ? dayjs(productoAgregadoCompra.vencimiento).local()
                    : null,
                }
              : item
          )
        )

        if (!productoAgregadoCompra.bonificacion)
          onChangeCostoTablaCompras({
            form,
            value: index,
            costo: Number(productoAgregadoCompra.precio_compra ?? 0),
          })
      } else {
        agregarProducto({ producto: productoAgregadoCompra })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregadoCompraStore])

  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        rowSelection={false}
        rowData={fields}
        columnDefs={useColumnsComprar({
          remove,
          form,
          incluye_precios,
          cantidad_pendiente,
        })}
      />
    </>
  )
}
