'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { useEffect, useCallback } from 'react'
import { useColumnsDetalleDeCompra } from '../../../_components/tables/columns-detalle-de-compra'
import { type Compra } from '~/lib/api/compra'
import { RowClickedEvent } from 'ag-grid-community'
import { type TableDetalleDeCompraProps } from '../../../_components/tables/columns-detalle-de-compra'

export default function TableDetalleOrdenCompra({
  compraSeleccionada,
  setCompraSeleccionada,
}: {
  compraSeleccionada: Compra | undefined
  setCompraSeleccionada: (value: Compra | undefined) => void
}) {
  useEffect(() => {
    setCompraSeleccionada(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<TableDetalleDeCompraProps>) => {
      event.node.setSelected(true)
    },
    []
  )

  return (
    <TableWithTitle<TableDetalleDeCompraProps>
      id='g-c-e-i.mis-compras.detalle-orden-compra'
      title='Detalle de Orden de Compra'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      columnDefs={useColumnsDetalleDeCompra()}
      onRowClicked={handleRowClicked}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Cod. Producto',
            'Producto',
            'Marca',
            'Unidad Derivada',
            'Cantidad',
            'P. Compra',
            '%',
            'Perc',
            'Importe',
            'F. Vencimiento',
            'Lote',
            'TotalUnd',
            'IdProd',
          ],
        },
      ]}
      rowData={
        compraSeleccionada?.productos_por_almacen?.flatMap(ppa =>
          (ppa.unidades_derivadas ?? []).map(ud => ({
            ...ud,
            costo: ppa.costo,
            producto_almacen: ppa.producto_almacen,
          }))
        ) ?? []
      }
    />
  )
}
