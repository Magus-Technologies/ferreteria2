import { AgGridReact } from 'ag-grid-react'
import { utils, writeFile } from 'xlsx-js-style'
import { Column, ValueFormatterParams } from 'ag-grid-community'
import TablePdfAgGrid from '../components/pdf/table-pdf-ag-grid'
import { ZodObjectDef, ZodRawShape, ZodType } from 'zod'
import { downloadPdf } from '~/hooks/use-react-to-pdf'

function exportFile<schemaType>({
  obj,
  nameFile,
  schema,
  colDefs,
  headersRequired = [],
}: {
  obj: Record<string, unknown>[]
  nameFile: string
  schema?: ZodType<schemaType>
  colDefs: Column[]
  headersRequired?: string[]
}) {
  if (!obj.length) {
    const objEmpty = colDefs.reduce((acc, col) => {
      const colDef = col.getColDef()
      const header = colDef.headerName!
      acc[header] = null
      return acc
    }, {} as Record<string, unknown>)
    obj.push(objEmpty)
  }

  const ws = utils.json_to_sheet(obj)

  const keys = Object.keys(obj[0] || {})
  keys.forEach((_, index) => {
    const cellRef = utils.encode_cell({ r: 0, c: index })
    ws[cellRef].s = {
      font: { bold: true },
    }
  })

  headersRequired.forEach(header => {
    const cellRef = utils.encode_cell({ r: 0, c: keys.indexOf(header) })
    if (ws[cellRef]) ws[cellRef].s.font.color = { rgb: 'FF0000' }
  })

  if (schema) {
    const schemaShape = (schema._def as ZodObjectDef<ZodRawShape>).shape()
    const requiredKeys = Object.keys(schemaShape).filter(key => {
      const field = schemaShape[key]
      return !field.isOptional()
    })
    const requiredHeaders = requiredKeys.map(
      key =>
        colDefs
          .find(col => col.getColDef().field?.split('.')[0] === key)
          ?.getColDef().headerName
    )
    keys.forEach((key, index) => {
      if (requiredHeaders.includes(key)) {
        const cellRef = utils.encode_cell({ r: 0, c: index })
        ws[cellRef].s.font.color = { rgb: 'FF0000' }
      }
    })
  }

  ws['!cols'] = keys.map(key => {
    const colValues = [key, ...obj.map(row => row[key] ?? '')]
    const maxLength = Math.max(...colValues.map(v => String(v).length))
    return { wch: maxLength + 1 }
  })

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

export function exportAGGridDataToJSON<schemaType>({
  gridOptions,
  nameFile,
  schema,
  headersRequired = [],
}: {
  gridOptions: AgGridReact
  nameFile: string
  schema?: ZodType<schemaType>
  headersRequired?: string[]
}) {
  const { rowData, colDefs } = getJsonFromAGGrid(gridOptions)
  exportFile({ obj: rowData, nameFile, schema, colDefs, headersRequired })
}

export async function exportAGGridDataToPDF(
  gridOptions: AgGridReact,
  nameFile: string,
  orientation: 'vertical' | 'horizontal' = 'vertical'
) {
  const { rowData, colDefs } = getJsonFromAGGrid(gridOptions)

  await downloadPdf({
    jsx: (
      <TablePdfAgGrid
        rowData={rowData}
        colDefs={colDefs}
        nameFile={nameFile}
        orientation={orientation}
      />
    ),
    name: nameFile,
  })
}
