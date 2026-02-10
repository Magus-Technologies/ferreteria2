'use client'

import React from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreValeSeleccionado } from './table-vales-compra'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

type DetalleVale = {
  codigo: string
  nombre: string
  descripcion: string
  tipo: string
  modalidad: string
  beneficio: string
  cantidad_minima: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  categorias?: string
  productos?: string
}

export default function TableDetalleVale() {
  const valeSeleccionado = useStoreValeSeleccionado((state) => state.vale)

  // Columnas horizontales (dentro de useMemo)
  const columnDefs = React.useMemo(() => {
    const cols: ColDef<DetalleVale>[] = [
      { headerName: 'Código', field: 'codigo', width: 120 },
      { headerName: 'Nombre', field: 'nombre', flex: 1 },
      { headerName: 'Descripción', field: 'descripcion', flex: 1 },
      { headerName: 'Tipo', field: 'tipo', width: 180 },
      { headerName: 'Modalidad', field: 'modalidad', width: 150 },
      { headerName: 'Beneficio', field: 'beneficio', width: 180 },
      { headerName: 'Cant. Mín', field: 'cantidad_minima', width: 100 },
      { headerName: 'Inicio', field: 'fecha_inicio', width: 110 },
      { headerName: 'Fin', field: 'fecha_fin', width: 110 },
      { headerName: 'Estado', field: 'estado', width: 100 },
    ]

    // Si hay categorías, agregar columna
    if (valeSeleccionado?.categorias && valeSeleccionado.categorias.length > 0) {
      cols.push({ headerName: 'Categorías', field: 'categorias', flex: 1 })
    }

    // Si hay productos, agregar columna
    if (valeSeleccionado?.productos && valeSeleccionado.productos.length > 0) {
      cols.push({ headerName: 'Productos', field: 'productos', flex: 1 })
    }

    return cols
  }, [valeSeleccionado])

  // Preparar datos del vale (una sola fila)
  const rowData: DetalleVale[] = React.useMemo(() => {
    if (!valeSeleccionado) return []

    const tipoPromocionLabel = {
      SORTEO: 'Sorteo',
      DESCUENTO_MISMA_COMPRA: 'Desc. Misma Compra',
      DESCUENTO_PROXIMA_COMPRA: 'Vale Próxima Compra',
      PRODUCTO_GRATIS: 'Producto Gratis',
    }[valeSeleccionado.tipo_promocion]

    const modalidadLabel = {
      CANTIDAD_MINIMA: 'Por Cantidad',
      POR_CATEGORIA: 'Por Categoría',
      POR_PRODUCTOS: 'Por Productos',
      MIXTO: 'Mixto',
    }[valeSeleccionado.modalidad]

    let beneficioTexto = ''
    if (valeSeleccionado.tipo_promocion === 'DESCUENTO_MISMA_COMPRA' || valeSeleccionado.tipo_promocion === 'DESCUENTO_PROXIMA_COMPRA') {
      beneficioTexto = valeSeleccionado.descuento_tipo === 'PORCENTAJE'
        ? `${valeSeleccionado.descuento_valor}% desc.`
        : `S/ ${valeSeleccionado.descuento_valor}`
    } else if (valeSeleccionado.tipo_promocion === 'PRODUCTO_GRATIS') {
      beneficioTexto = `${valeSeleccionado.cantidad_producto_gratis} ${valeSeleccionado.producto_gratis?.name || 'prod.'} GRATIS`
    } else if (valeSeleccionado.tipo_promocion === 'SORTEO') {
      beneficioTexto = 'Sorteo'
    }

    const detalle: DetalleVale = {
      codigo: valeSeleccionado.codigo,
      nombre: valeSeleccionado.nombre,
      descripcion: valeSeleccionado.descripcion || '-',
      tipo: tipoPromocionLabel,
      modalidad: modalidadLabel,
      beneficio: beneficioTexto,
      cantidad_minima: `${valeSeleccionado.cantidad_minima} und`,
      fecha_inicio: new Date(valeSeleccionado.fecha_inicio).toLocaleDateString('es-ES'),
      fecha_fin: valeSeleccionado.fecha_fin ? new Date(valeSeleccionado.fecha_fin).toLocaleDateString('es-ES') : 'Sin límite',
      estado: valeSeleccionado.estado,
    }

    if (valeSeleccionado.categorias && valeSeleccionado.categorias.length > 0) {
      detalle.categorias = valeSeleccionado.categorias.map(c => c.name).join(', ')
    }

    if (valeSeleccionado.productos && valeSeleccionado.productos.length > 0) {
      detalle.productos = valeSeleccionado.productos.map(p => p.name).join(', ')
    }

    return [detalle]
  }, [valeSeleccionado])

  return (
    <div className='w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[600px]'>
      <TableWithTitle<DetalleVale>
        id='detalle-vale'
        title='Detalle Vale'
        selectionColor={orangeColors[10]}
        columnDefs={columnDefs}
        rowData={rowData}
      />
    </div>
  )
}
