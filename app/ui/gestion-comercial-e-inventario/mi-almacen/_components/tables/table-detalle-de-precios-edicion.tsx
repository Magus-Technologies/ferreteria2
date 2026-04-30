'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { FormInstance, FormListFieldData } from 'antd'
import { useColumnsDetalleDePreciosEdicion } from './columns-detalle-de-precios-edicion'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'

interface TableDetalleDePreciosEdicionProps
  extends Omit<
    TableWithTitleProps<FormListFieldData>,
    | 'rowData'
    | 'columnDefs'
    | 'id'
    | 'title'
    | 'paramsOfThemeTable'
    | 'rowSelection'
    | 'exportExcel'
    | 'exportPdf'
    | 'selectColumns'
  > {
  data: FormListFieldData[]
  remove: (index: number | number[]) => void
  form: FormInstance
}

export default function TableDetalleDePreciosEdicion({
  data,
  remove,
  form,
  ...rest
}: TableDetalleDePreciosEdicionProps) {
  return (
    <>
      <CellFocusWithoutStyle />
      <TableWithTitle
        {...rest}
        onRowDragEnd={event => {
          // MOVE (no swap): sacar el item de su posición y insertarlo en la
          // nueva. Antes hacía un swap (intercambio entre 2 posiciones), lo
          // que daba un orden inesperado al arrastrar varias filas.
          const fromIndex = event.node.data!.name as number
          const toIndex = event.overIndex
          if (fromIndex === toIndex || toIndex < 0) return

          const unidades = [
            ...((form.getFieldValue('unidades_derivadas') ?? []) as any[]),
          ]
          const [movido] = unidades.splice(fromIndex, 1)
          unidades.splice(toIndex, 0, movido)
          form.setFieldValue('unidades_derivadas', unidades)
        }}
        id='g-c-e-i.mi-almacen.detalle-de-precios-edicion'
        title='Detalle de precios'
        columnDefs={useColumnsDetalleDePreciosEdicion({ remove, form })}
        paramsOfThemeTable={{
          spacing: 6,
        }}
        rowSelection={false}
        rowData={data}
        exportExcel={false}
        exportPdf={false}
        selectColumns={false}
      />
    </>
  )
}
