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
import { useEffect, useMemo } from 'react'
import { FormCreateVenta } from '../others/body-vender'
import { useConfigMode } from '~/app/ui/configuracion/permisos-visuales/_components/config-mode-context'

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

  // Detectar si estamos en modo configuración
  const configMode = useConfigMode()
  
  console.log('🔍 TableVender - configMode:', configMode?.enabled, 'fields.length:', fields.length)
  
  // Datos de demostración para modo configuración - agregar al formulario
  const demoProductos = useMemo(() => [
    {
      producto_id: 1,
      producto_name: 'Cemento Portland Tipo I',
      producto_codigo: 'CEM-001',
      marca_name: 'Sol',
      unidad_derivada_id: 1,
      unidad_derivada_name: 'Bolsa',
      unidad_derivada_factor: 1,
      cantidad: 10,
      precio_venta: 28.50,
      recargo: 0,
      subtotal: 285.00,
    },
    {
      producto_id: 2,
      producto_name: 'Fierro Corrugado 1/2"',
      producto_codigo: 'FIE-002',
      marca_name: 'Aceros Arequipa',
      unidad_derivada_id: 2,
      unidad_derivada_name: 'Varilla',
      unidad_derivada_factor: 1,
      cantidad: 20,
      precio_venta: 35.00,
      recargo: 2.00,
      subtotal: 740.00,
    },
    {
      producto_id: 3,
      producto_name: 'Arena Gruesa',
      producto_codigo: 'ARE-003',
      marca_name: 'Agregados Perú',
      unidad_derivada_id: 3,
      unidad_derivada_name: 'M3',
      unidad_derivada_factor: 1,
      cantidad: 5,
      precio_venta: 80.00,
      recargo: 0,
      subtotal: 400.00,
    },
  ], [])
  
  // Agregar productos de demo al formulario en modo configuración
  useEffect(() => {
    if (configMode?.enabled && fields.length === 0) {
      console.log('📝 Agregando productos de demo al formulario')
      demoProductos.forEach((producto) => {
        add(producto)
      })
    }
  }, [configMode?.enabled, fields.length, demoProductos, add])
  
  // Datos de demostración para ag-grid (con estructura FormListFieldData)
  const demoData = useMemo(() => [
    {
      key: 'demo-1',
      name: 0,
      fieldKey: 0,
      producto_id: 1,
      producto_name: 'Cemento Portland Tipo I',
      producto_codigo: 'CEM-001',
      marca_name: 'Sol',
      unidad_derivada_id: 1,
      unidad_derivada_name: 'Bolsa',
      unidad_derivada_factor: 1,
      cantidad: 10,
      precio_venta: 28.50,
      recargo: 0,
      subtotal: 285.00,
    },
    {
      key: 'demo-2',
      name: 1,
      fieldKey: 1,
      producto_id: 2,
      producto_name: 'Fierro Corrugado 1/2"',
      producto_codigo: 'FIE-002',
      marca_name: 'Aceros Arequipa',
      unidad_derivada_id: 2,
      unidad_derivada_name: 'Varilla',
      unidad_derivada_factor: 1,
      cantidad: 20,
      precio_venta: 35.00,
      recargo: 2.00,
      subtotal: 740.00,
    },
    {
      key: 'demo-3',
      name: 2,
      fieldKey: 2,
      producto_id: 3,
      producto_name: 'Arena Gruesa',
      producto_codigo: 'ARE-003',
      marca_name: 'Agregados Perú',
      unidad_derivada_id: 3,
      unidad_derivada_name: 'M3',
      unidad_derivada_factor: 1,
      cantidad: 5,
      precio_venta: 80.00,
      recargo: 0,
      subtotal: 400.00,
    },
  ], [])

  // Usar datos de demo si estamos en modo configuración y no hay fields
  const rowData = configMode?.enabled && fields.length === 0 ? demoData : fields
  
  console.log('📊 TableVender rowData:', rowData, 'length:', rowData.length)

  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        className='h-full'
        rowSelection={false}
        rowData={rowData as any}
        columnDefs={useColumnsVender({
          remove,
          form,
          cantidad_pendiente,
          venta,
        })}
        suppressCellFocus={true}
        withNumberColumn={false}
        domLayout={configMode?.enabled ? 'normal' : undefined}
      />
    </>
  )
}
