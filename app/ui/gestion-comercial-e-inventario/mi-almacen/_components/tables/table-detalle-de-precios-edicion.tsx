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
          const indexActual = event.overIndex
          const indexAnterior = event.node.data!.name
          const unidades_derivadas = form.getFieldValue(
            'unidades_derivadas'
          ) as FormListFieldData[]
          const unidadDerivadaAnterior = unidades_derivadas[indexAnterior]
          const unidadDerivadaActual = unidades_derivadas[indexActual]
          unidades_derivadas[indexAnterior] = unidadDerivadaActual
          unidades_derivadas[indexActual] = unidadDerivadaAnterior
          form.setFieldValue('unidades_derivadas', unidades_derivadas)
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
