import { AgGridReact } from 'ag-grid-react'
import { utils, writeFile } from 'xlsx'
import { Column, ValueFormatterParams } from 'ag-grid-community'
import { pdf } from '@react-pdf/renderer'
import TablePdfAgGrid from '../components/pdf/table-pdf-ag-grid'

function exportFile(obj: Record<string, unknown>[], nameFile: string) {
  const ws = utils.json_to_sheet(obj)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Data')
  writeFile(wb, `${nameFile}.xlsx`)
}

function getNestedValue<T>(obj: unknown, path: string): T | undefined {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj
    ) as T | undefined
}

export function getJsonFromAGGrid(gridOptions: AgGridReact) {
  const gridApi = gridOptions.api
  const rowData: Record<string, unknown>[] = []

  const colDefsPrev = gridApi.getAllDisplayedColumns() as Column[]
  const colDefs = colDefsPrev.filter(
    col =>
      col.getColDef().type !== 'actions' &&
      col.getColDef().type !== 'numberColumn'
  )

  gridApi.forEachNodeAfterFilterAndSort(node => {
    const data = node.data
    const data_obj = {} as Record<string, unknown>
    colDefs.forEach(col => {
      const colDef = col.getColDef()
      const field = colDef.field!
      const header = colDef.headerName!
      const rawValue = getNestedValue(data, field)
      let displayValue: unknown
      if (typeof colDef.valueFormatter === 'function')
        displayValue = colDef.valueFormatter({
          value: rawValue,
          data,
        } as ValueFormatterParams)
      else displayValue = rawValue
      data_obj[header] = displayValue
    })
    rowData.push(data_obj)
  })

  return { rowData, colDefs }
}

export function exportAGGridDataToJSON(
  gridOptions: AgGridReact,
  nameFile: string
) {
  const { rowData } = getJsonFromAGGrid(gridOptions)
  exportFile(rowData, nameFile)
}

export async function exportAGGridDataToPDF(
  gridOptions: AgGridReact,
  nameFile: string,
  orientation: 'vertical' | 'horizontal' = 'vertical'
) {
  const { rowData, colDefs } = getJsonFromAGGrid(gridOptions)

  const blob = await pdf(
    <TablePdfAgGrid
      rowData={rowData}
      colDefs={colDefs}
      nameFile={nameFile}
      orientation={orientation}
    />
  ).toBlob()
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `${nameFile}.pdf`
  link.click()
  URL.revokeObjectURL(blobUrl)
}
