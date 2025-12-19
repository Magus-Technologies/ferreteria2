'use client'

import { FormInstance } from 'antd'
import { ColDef } from 'ag-grid-community'
import type { FormCreateCotizacion, DescuentoTipo } from '../../_types/cotizacion.types'
import { FaTrash } from 'react-icons/fa'

export function calcularSubtotalCotizacion({
  precio_venta,
  recargo = 0,
  cantidad,
  descuento = 0,
  descuento_tipo,
}: {
  precio_venta: number
  recargo?: number
  cantidad: number
  descuento?: number
  descuento_tipo: DescuentoTipo
}) {
  const precioConRecargo = precio_venta + recargo
  const subtotalSinDescuento = precioConRecargo * cantidad

  if (descuento_tipo === 'Monto') {
    return (subtotalSinDescuento - descuento).toFixed(2)
  } else {
    const descuentoCalculado = (subtotalSinDescuento * descuento) / 100
    return (subtotalSinDescuento - descuentoCalculado).toFixed(2)
  }
}

export function useColumnsCotizar({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>
}): ColDef<FormCreateCotizacion['productos'][number]>[] {
  return [
    {
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      width: 50,
      pinned: 'left',
    },
    {
      headerName: 'Código',
      field: 'producto_codigo',
      width: 120,
    },
    {
      headerName: 'Descripción',
      field: 'producto_name',
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'Marca',
      field: 'marca_name',
      width: 120,
    },
    {
      headerName: 'U.Medida',
      field: 'unidad_derivada_name',
      width: 100,
    },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 80,
      valueFormatter: (params) => params.value?.toFixed(2),
    },
    {
      headerName: 'Precio',
      field: 'precio_venta',
      width: 100,
      valueFormatter: (params) => `S/. ${params.value?.toFixed(2)}`,
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      width: 120,
      valueGetter: (params) => {
        const { precio_venta, recargo, cantidad, descuento, descuento_tipo } =
          params.data || {}
        return calcularSubtotalCotizacion({
          precio_venta: precio_venta || 0,
          recargo: recargo || 0,
          cantidad: cantidad || 0,
          descuento: descuento || 0,
          descuento_tipo: descuento_tipo || 'Monto',
        })
      },
      valueFormatter: (params) => `S/. ${params.value}`,
    },
    {
      headerName: 'Acciones',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: { node: { rowIndex: number } }) => {
        return (
          <button
            onClick={() => {
              const productos = (form.getFieldValue('productos') || []) as FormCreateCotizacion['productos']
              const newProductos = productos.filter(
                (_, index: number) => index !== params.node.rowIndex
              )
              form.setFieldValue('productos', newProductos)
            }}
            className='text-red-600 hover:text-red-800 p-2'
          >
            <FaTrash />
          </button>
        )
      },
    },
  ]
}
