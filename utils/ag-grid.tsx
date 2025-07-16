import { AgGridReact } from 'ag-grid-react'
import { utils, writeFile } from 'xlsx'
import { Column } from 'ag-grid-community'
import { render } from '@react-pdf/renderer'
import TablePdfAgGrid from '../components/pdf/table-pdf-ag-grid'

function exportFile(obj: Record<string, unknown>[], nameFile: string) {
  const ws = utils.json_to_sheet(obj)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Data')
  writeFile(wb, `${nameFile}.xlsx`)
}

export function getJsonFromAGGrid(gridOptions: AgGridReact) {
  const gridApi = gridOptions.api
  const rowData: Record<string, unknown>[] = []

  const colDefs = gridApi.getAllDisplayedColumns() as Column[]

  gridApi.forEachNodeAfterFilterAndSort(node => {
    const data = node.data
    const data_obj = {} as Record<string, unknown>
    colDefs.forEach(col => {
      const colDef = col.getColDef()
      const field = colDef.field!
      const header = colDef.headerName!
      data_obj[header] = data[field]
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

export function exportAGGridDataToPDF(
  gridOptions: AgGridReact,
  nameFile: string
) {
  const { rowData, colDefs } = getJsonFromAGGrid(gridOptions)
  render(
    <TablePdfAgGrid rowData={rowData} colDefs={colDefs} nameFile={nameFile} />,
    `${nameFile}.pdf`
  )
}
