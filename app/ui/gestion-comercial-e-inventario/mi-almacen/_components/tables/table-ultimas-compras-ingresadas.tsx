'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsUltimasComprasIngresadas } from './columns-ultimas-compras-ingresadas'
import type { UltimasComprasType } from './columns-ultimas-compras-ingresadas'
import { useStoreAlmacen } from '~/store/store-almacen'
import { getProductosResponseProps } from '~/app/_actions/producto'
import { greenColors } from '~/lib/colors'

// Importar el tipo desde las columnas para mantener consistencia

export default function TableUltimasComprasIngresadas({
  id,
  productoSeleccionado,
}: {
  id: string
  productoSeleccionado: getProductosResponseProps | undefined
}) {
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const producto_en_almacen = productoSeleccionado?.producto_en_almacenes.find(
    item => item.almacen_id === almacen_id
  )

  const rowData = producto_en_almacen
    ? producto_en_almacen!.compras?.flatMap(ppa =>
        ppa.unidades_derivadas.map(ud => ({
          ...ud,
          costo: ppa.costo,
          compra: ppa.compra,
        }))
      )
    : []

  return (
    <TableWithTitle
      id={id}
      title='Últimas 6 compras ingresadas'
      selectionColor={greenColors[10]} // Color verde para gestión comercial e inventario
      extraTitle={
        <>
          {' '}
          de
          <span className='italic -ml-2 text-blue-900'>
            {productoSeleccionado ? productoSeleccionado.name : '-'}
          </span>
        </>
      }
      columnDefs={useColumnsUltimasComprasIngresadas()}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Documento',
            'Serie',
            'Número',
            'Fecha',
            'Razón Social',
            'Registrado por',
            'U. Derivada',
            'Cant.',
            'Precio',
            'Subtotal',
          ],
        },
      ]}
      rowData={rowData as unknown as UltimasComprasType[]}
    />
  )
}
