import TableWithTitle from '~/components/tables/table-with-title'
import { FormInstance } from 'antd/lib'
import { FormListFieldData } from 'antd'
import { StoreValue } from 'antd/es/form/interface'
import { useColumnsVender } from './columns-vender'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'
// ModalDetallePaqueteVenta ya no se necesita - sub-productos se muestran inline
import {
  useStoreProductoAgregadoVenta,
  ValuesCardAgregarProductoVenta,
} from '../../_store/store-producto-agregado-venta'
import { useEffect, useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { FormCreateVenta } from '../others/body-vender'
import { useConfigMode } from '~/app/ui/configuracion/permisos-visuales/_components/config-mode-context'
import type { ValeCompra } from '~/lib/api/vales-compra'

function condicionEditarProductoVenta({
  producto,
  item,
}: {
  producto: ValuesCardAgregarProductoVenta
  item: ValuesCardAgregarProductoVenta
}) {
  // Nunca agrupar filas de paquete (cabecera o sub-producto) con nada
  if (producto._tipo_fila === 'paquete_cabecera' || producto._tipo_fila === 'paquete_producto') return false
  if (item._tipo_fila === 'paquete_cabecera' || item._tipo_fila === 'paquete_producto') return false

  // No agrupar si el item existente pertenece a un paquete y el nuevo no (o viceversa)
  // Solo agrupar si ambos tienen el mismo paquete_id (o ambos no tienen)
  if (item.paquete_id !== producto.paquete_id) return false

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
  const valesAplicables = useStoreProductoAgregadoVenta(
    (store) => store.valesAplicables
  )

  function agregarProducto({
    producto,
  }: {
    producto: ValuesCardAgregarProductoVenta
  }) {
    const isPaqueteFila = producto._tipo_fila === 'paquete_cabecera' || producto._tipo_fila === 'paquete_producto'
    add({
      ...producto,
      // Paquete rows already have subtotal = (precio - descuento) × qty calculated correctly.
      // Normal rows: recalculate gross (discount handled separately in the right panel).
      subtotal: isPaqueteFila
        ? Number(producto.subtotal ?? 0)
        : Number(
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
      // Sub-produto de paquete → saltar si ya existe en la tabla (evita duplicar al re-agregar el mismo paquete)
      // Usa path-based getFieldValue igual que getRowStyle, garantizado por Form.List
      if (productoAgregadoVenta._tipo_fila === 'paquete_produto') {
        const paqueteId = (productoAgregadoVenta as any).paquete_id
        const alreadyExists = fields.some((f) =>
          form.getFieldValue(['productos', f.name, '_tipo_fila']) === 'paquete_produto' &&
          form.getFieldValue(['productos', f.name, 'paquete_id']) === paqueteId &&
          form.getFieldValue(['productos', f.name, 'producto_id']) === productoAgregadoVenta.producto_id
        )
        if (alreadyExists) return
      }

      // Cabecera de paquete → si ya existe uno con el mismo paquete_id, incrementar cantidad
      if (productoAgregadoVenta._tipo_fila === 'paquete_cabecera') {
        const paqueteId = (productoAgregadoVenta as any).paquete_id
        const existingField = fields.find((f) =>
          form.getFieldValue(['productos', f.name, '_tipo_fila']) === 'paquete_cabecera' &&
          form.getFieldValue(['productos', f.name, 'paquete_id']) === paqueteId
        )

        if (existingField) {
          const cabIdx = existingField.name
          // Recoger sub-products consecutivos usando path-based lookup
          const subFields: number[] = []
          for (let i = cabIdx + 1; i < fields.length; i++) {
            const fIdx = fields[i]?.name ?? i
            if (form.getFieldValue(['productos', fIdx, '_tipo_fila']) !== 'paquete_produto') break
            subFields.push(fIdx)
          }

          const allProductos = (form.getFieldValue('productos') || []) as any[]
          const updates = [...allProductos]
          const cab = updates[cabIdx]
          const nuevaCantPaquete = Number(form.getFieldValue(['productos', cabIdx, 'cantidad_paquete']) || 1) + 1

          let precioPaqueteUnit = 0
          for (const si of subFields) {
            precioPaqueteUnit +=
              (Number(form.getFieldValue(['productos', si, 'precio_venta']) || 0) -
               Number(form.getFieldValue(['productos', si, 'descuento']) || 0)) *
              Number(form.getFieldValue(['productos', si, 'cantidad_base']) || 1)
          }

          for (const si of subFields) {
            const cantBase = Number(form.getFieldValue(['productos', si, 'cantidad_base']) || 1)
            const nuevaCantSub = cantBase * nuevaCantPaquete
            updates[si] = {
              ...updates[si],
              cantidad: nuevaCantSub,
              subtotal:
                (Number(form.getFieldValue(['productos', si, 'precio_venta']) || 0) -
                 Number(form.getFieldValue(['productos', si, 'descuento']) || 0)) *
                nuevaCantSub,
            }
          }

          updates[cabIdx] = {
            ...cab,
            cantidad_paquete: nuevaCantPaquete,
            cantidad: nuevaCantPaquete,
            precio_venta: precioPaqueteUnit,
            subtotal: precioPaqueteUnit * nuevaCantPaquete,
          }

          form.setFieldValue('productos', updates)
          return
        }
        // Sin existente → agregar normalmente (continúa el flujo)
      }

      // Los servicios siempre se agregan como filas nuevas (no se agrupan)
      if (productoAgregadoVenta._tipo === 'servicio') {
        agregarProducto({ producto: productoAgregadoVenta })
        return
      }

      if (
        !productosVenta.find(
          (item) => item.producto_id === productoAgregadoVenta.producto_id
        )
      )
        setProductosVenta((prev) => [...prev, productoAgregadoVenta])

      const productos = (form.getFieldValue('productos') ||
        []) as FormCreateVenta['productos']

      const producto_existente = productos.find(
        (item) => item.producto_id === productoAgregadoVenta.producto_id &&
          item.paquete_id === productoAgregadoVenta.paquete_id
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

  // Helper para obtener beneficio del vale
  const getBeneficioVale = useCallback((vale: ValeCompra) => {
    if (vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor)
      return `${vale.descuento_valor}% DSCTO`
    if (vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor)
      return `S/ ${Number(vale.descuento_valor).toFixed(2)} DSCTO`
    if (vale.tipo_promocion === 'PRODUCTO_GRATIS') return 'PRODUCTO GRATIS'
    if (vale.tipo_promocion === 'DOS_POR_UNO') return '2x1'
    return vale.tipo_promocion
  }, [])

  // Sincronizar vales aplicables como filas informativas en la tabla
  const prevValeIdsRef = useRef<string>('')
  useEffect(() => {
    const valeIds = valesAplicables.map(v => v.id).sort().join(',')
    if (valeIds === prevValeIdsRef.current) return
    prevValeIdsRef.current = valeIds

    const productos = (form.getFieldValue('productos') || []) as FormCreateVenta['productos']

    // Remover filas de vales existentes
    const indicesVales: number[] = []
    productos.forEach((p, i) => {
      if (p._tipo_fila === 'vale_promocional') indicesVales.push(i)
    })
    if (indicesVales.length > 0) {
      remove(indicesVales.reverse())
    }

    // Agregar nuevas filas de vales
    for (const vale of valesAplicables) {
      add({
        _tipo_fila: 'vale_promocional',
        producto_id: -vale.id,
        producto_name: `${vale.nombre} (${getBeneficioVale(vale)})`,
        producto_codigo: vale.codigo,
        marca_name: '',
        unidad_derivada_id: 0,
        unidad_derivada_name: '',
        unidad_derivada_factor: 1,
        cantidad: 1,
        precio_venta: 0,
        recargo: 0,
        descuento: 0,
        subtotal: 0,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valesAplicables])

  // Detectar si estamos en modo configuración
  const configMode = useConfigMode()
  
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
  const baseRowData = configMode?.enabled && fields.length === 0 ? demoData : fields

  // Mostrar todas las filas (paquete cabecera + sub-productos + productos normales)
  const rowData = baseRowData as FormListFieldData[]

  const { columns } = useColumnsVender({
    remove,
    form,
    cantidad_pendiente,
    venta,
  })

  const agGridRef = useRef<AgGridReact>(null)

  return (
    <>
      <CellFocusWithoutStyle />
      <TableWithTitle
        id="crear-venta-productos"
        title="Productos de Venta"
        tableRef={agGridRef}
        columnDefs={columns}
        rowData={rowData as any}
        rowSelection={false}
        suppressCellFocus={true}
        withNumberColumn={false}
        domLayout={configMode?.enabled ? 'normal' : undefined}
        getRowStyle={(params) => {
          const idx = params.data?.name
          if (idx == null) return undefined
          const tipoFila = form.getFieldValue(['productos', idx, '_tipo_fila'])
          if (tipoFila === 'paquete_cabecera') {
            return { background: '#fffbeb', borderLeft: '3px solid #f59e0b' }
          }
          if (tipoFila === 'paquete_producto') {
            return { background: '#f3f4f6', borderLeft: '3px solid #d1d5db' }
          }
          if (tipoFila === 'vale_promocional') {
            return { background: '#f0fdf4', borderLeft: '3px solid #22c55e' }
          }
          return undefined
        }}
      />
    </>
  )
}
