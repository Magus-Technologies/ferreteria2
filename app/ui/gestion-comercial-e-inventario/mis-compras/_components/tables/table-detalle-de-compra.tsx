'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { useEffect } from 'react'
import {
  TableDetalleDeCompraProps,
  useColumnsDetalleDeCompra,
} from './columns-detalle-de-compra'
import { getComprasResponseProps } from '~/app/_actions/compra'

export default function TableDetalleDeCompra({
  id,
  compraSeleccionada,
  setCompraSeleccionada,
}: {
  id: string
  compraSeleccionada: getComprasResponseProps | undefined
  setCompraSeleccionada: (value: getComprasResponseProps | undefined) => void
}) {
  useEffect(() => {
    setCompraSeleccionada(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TableWithTitle<TableDetalleDeCompraProps>
      id={id}
      title='Detalle de Compra'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      columnDefs={useColumnsDetalleDeCompra()}
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
            'Importe',
            'F. Vencimiento',
            'Lote',
          ],
        },
      ]}
      rowData={
        compraSeleccionada?.productos_por_almacen?.flatMap(ppa =>
          ppa.unidades_derivadas.map(ud => ({
            ...ud,
            costo: ppa.costo,
            producto_almacen: ppa.producto_almacen,
          }))
        ) ?? []
      }
    />
  )
}
