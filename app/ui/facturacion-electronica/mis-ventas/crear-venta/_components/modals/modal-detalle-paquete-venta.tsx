'use client'

import { Modal } from 'antd'
import { ColDef } from 'ag-grid-community'
import { useMemo } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'

interface ProductoPaqueteDetalle {
  producto_name: string
  producto_codigo: string
  marca_name: string
  unidad_derivada_name: string
  cantidad: number
  precio_venta: number
  descuento: number
  recargo: number
  subtotal: number
}

interface ModalDetallePaqueteVentaProps {
  open: boolean
  onClose: () => void
  paqueteNombre: string
  productos: ProductoPaqueteDetalle[]
}

export default function ModalDetallePaqueteVenta({
  open,
  onClose,
  paqueteNombre,
  productos,
}: ModalDetallePaqueteVentaProps) {
  const columnDefs: ColDef<ProductoPaqueteDetalle>[] = [
    {
      headerName: 'Código',
      field: 'producto_codigo',
      width: 100,
    },
    {
      headerName: 'Producto',
      field: 'producto_name',
      flex: 1,
      minWidth: 150,
      cellClass: 'font-medium',
    },
    {
      headerName: 'Marca',
      field: 'marca_name',
      width: 100,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'U. Derivada',
      field: 'unidad_derivada_name',
      width: 110,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 90,
      valueFormatter: (params) => Number(params.value || 0).toFixed(2),
    },
    {
      headerName: 'Precio',
      field: 'precio_venta',
      width: 90,
      valueFormatter: (params) => Number(params.value || 0).toFixed(2),
    },
    {
      headerName: 'Descuento',
      field: 'descuento',
      width: 100,
      valueFormatter: (params) => Number(params.value || 0).toFixed(2),
    },
    {
      headerName: 'SubTotal',
      field: 'subtotal',
      width: 100,
      valueFormatter: (params) => Number(params.value || 0).toFixed(2),
    },
  ]

  const totalSubtotal = useMemo(
    () => productos.reduce((acc, p) => acc + Number(p.subtotal || 0), 0),
    [productos],
  )

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`📦 ${paqueteNombre}`}
      width={900}
      destroyOnHidden
      footer={
        <div className="flex justify-end items-center gap-2 py-1 pr-2">
          <span className="font-semibold text-gray-600">Total:</span>
          <span className="font-bold text-lg">S/. {totalSubtotal.toFixed(2)}</span>
        </div>
      }
    >
      <TableWithTitle<ProductoPaqueteDetalle>
        id="paquete.detalle.venta"
        title={paqueteNombre}
        selectionColor={orangeColors[10]}
        columnDefs={columnDefs}
        rowData={productos}
        getRowId={(params) => String(params.data.producto_codigo)}
        pagination={false}
        domLayout="autoHeight"
        overlayNoRowsTemplate='<span class="text-gray-500">No hay productos en este paquete</span>'
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: ['Código', 'Producto', 'Marca', 'U. Derivada', 'Cantidad', 'Precio', 'Descuento', 'SubTotal'],
          },
        ]}
      />
    </Modal>
  )
}
