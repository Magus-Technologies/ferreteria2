import TableBase from '~/components/tables/table-base'
import { FormInstance } from 'antd/lib'
import { FormListFieldData } from 'antd'
import { StoreValue } from 'antd/es/form/interface'
import { useColumnsGuia } from './columns-guia'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'
import {
  useStoreProductoAgregadoGuia,
  ValuesCardAgregarProductoGuia,
} from '../../_store/store-producto-agregado-guia'
import { useEffect } from 'react'
import { FormCreateGuia } from '../others/body-crear-guia'

function condicionEditarProductoGuia({
  producto,
  item,
}: {
  producto: ValuesCardAgregarProductoGuia
  item: ValuesCardAgregarProductoGuia
}) {
  return (
    item.producto_id === producto.producto_id &&
    item.unidad_derivada_id === producto.unidad_derivada_id
  )
}

export default function TableGuia({
  form,
  fields,
  remove,
  add,
  guia,
}: {
  form: FormInstance
  fields: FormListFieldData[]
  remove: (index: number | number[]) => void
  add: (defaultValue?: StoreValue, insertIndex?: number) => void
  guia?: any
}) {
  const productoAgregadoGuiaStore = useStoreProductoAgregadoGuia(
    (store) => store.productoAgregado
  )
  const productosGuia = useStoreProductoAgregadoGuia(
    (store) => store.productos
  )
  const setProductosGuia = useStoreProductoAgregadoGuia(
    (store) => store.setProductos
  )

  function agregarProducto({
    producto,
  }: {
    producto: ValuesCardAgregarProductoGuia
  }) {
    add({
      ...producto,
    })
  }

  useEffect(() => {
    const productoAgregadoGuia = { ...productoAgregadoGuiaStore }
    if (
      productoAgregadoGuia &&
      Object.keys(productoAgregadoGuia).length &&
      productoAgregadoGuia.producto_id
    ) {
      if (
        !productosGuia.find(
          (item) => item.producto_id === productoAgregadoGuia.producto_id
        )
      )
        setProductosGuia((prev) => [...prev, productoAgregadoGuia])

      const productos = (form.getFieldValue('productos') ||
        []) as FormCreateGuia['productos']

      const producto_existente = productos.find(
        (item) => item.producto_id === productoAgregadoGuia.producto_id
      )
      if (!producto_existente) {
        agregarProducto({ producto: productoAgregadoGuia })
        return
      }

      const producto_unidad_derivada_existente = productos.find((item) =>
        condicionEditarProductoGuia({
          producto: productoAgregadoGuia,
          item,
        })
      )
      if (producto_unidad_derivada_existente) {
        const index = productos.findIndex((item) =>
          condicionEditarProductoGuia({
            producto: productoAgregadoGuia,
            item,
          })
        )

        if (index <= -1) return

        const nueva_cantidad =
          Number(productoAgregadoGuia.cantidad) +
          Number(producto_unidad_derivada_existente.cantidad)
        setProductosGuia((prev) =>
          prev.map((item) => {
            return condicionEditarProductoGuia({
              producto: productoAgregadoGuia,
              item,
            })
              ? {
                  ...productoAgregadoGuia,
                  cantidad: nueva_cantidad,
                }
              : item
          })
        )

        form.setFieldValue(
          'productos',
          productos.map((item, i) =>
            i === index
              ? {
                  ...productoAgregadoGuia,
                  cantidad: nueva_cantidad,
                }
              : item
          )
        )
      } else {
        agregarProducto({ producto: productoAgregadoGuia })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregadoGuiaStore])

  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        className='h-[300px] md:h-[400px] lg:h-[500px]'
        rowSelection={false}
        rowData={fields}
        columnDefs={useColumnsGuia({
          remove,
          form,
        })}
      />
    </>
  )
}
