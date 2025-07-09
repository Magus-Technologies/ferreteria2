import { AgGridReact } from 'ag-grid-react'
import { utils, writeFile } from 'xlsx'
import { ColDef } from 'ag-grid-community'

function exportFile(obj: Record<string, unknown>[], nameFile: string) {
  const ws = utils.json_to_sheet(obj)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Data')
  writeFile(wb, `${nameFile}.xlsx`)
}

export function exportAGGridDataToJSON(
  gridOptions: AgGridReact,
  nameFile: string
) {
  const gridApi = gridOptions.api
  const rowData: Record<string, unknown>[] = []

  const colDefs = gridApi.getColumnDefs() as ColDef[]
  const headers = colDefs?.reduce((acc, col) => {
    acc[col.field!] = col.headerName!
    return acc
  }, {} as Record<string, string>)

  gridApi.forEachNodeAfterFilterAndSort(node => {
    const data = node.data
    const data_obj = {} as Record<string, unknown>
    for (const key in data) {
      const newKey = headers?.[key] || key
      data_obj[newKey] = data[key]
    }
    rowData.push(data_obj)
  })

  exportFile(rowData, nameFile)
}
