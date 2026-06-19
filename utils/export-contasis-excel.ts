import { utils, writeFile, type WorkSheet } from 'xlsx-js-style'
import type { ContasisVentaItem, ContasisCompraItem } from '~/lib/api/contasis'

// Shared cell style helpers
const hStyle = (rgb: string) => ({
  font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb } },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  },
})

const dStyle = (align: 'left' | 'right' | 'center' = 'left') => ({
  font: { sz: 8 },
  alignment: { horizontal: align, vertical: 'middle' as const },
  border: {
    top: { style: 'thin', color: { rgb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
    left: { style: 'thin', color: { rgb: 'CCCCCC' } },
    right: { style: 'thin', color: { rgb: 'CCCCCC' } },
  },
})

const numFormat = '#,##0.00'

function applyStyles(ws: WorkSheet, headerRow: number, dataStart: number, dataEnd: number, numCols: number) {
  for (let c = 0; c < numCols; c++) {
    const hCell = utils.encode_cell({ r: headerRow, c })
    if (ws[hCell]) ws[hCell].s = hStyle('1F4E79')
  }
  for (let r = dataStart; r <= dataEnd; r++) {
    for (let c = 0; c < numCols; c++) {
      const cell = utils.encode_cell({ r, c })
      if (!ws[cell]) continue
      const isNum = typeof ws[cell].v === 'number'
      ws[cell].s = dStyle(isNum ? 'right' : 'left')
      if (isNum && c >= 8) ws[cell].z = numFormat
    }
  }
}

// ──────────────────────────────────────────────────────────────
// VENTAS
// ──────────────────────────────────────────────────────────────
export function exportContasisVentasToExcel(
  items: ContasisVentaItem[],
  opts: { desde: string; hasta: string; empresa?: string; nameFile?: string },
) {
  const data: any[][] = []

  // Header info
  data.push([opts.empresa ?? 'MI EMPRESA', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  data.push([`Período: ${opts.desde} al ${opts.hasta}`])
  data.push(['REGISTRO DE VENTAS — FORMATO CONTASIS'])
  data.push([])

  const HEADER_ROW = 4
  data.push([
    'ffechadoc', 'ffechaven', 'ccoddoc', 'cserie', 'cnumero',
    'ccodenti', 'ccodruc', 'crazsoc',
    'nbase1', 'nigv1', 'ntots', 'ntc',
    'crefdoc', 'crefser', 'crefnum', 'cglosa',
  ])

  const DATA_START = 5
  for (const item of items) {
    data.push([
      item.ffechadoc ?? '',
      item.ffechaven ?? '',
      item.ccoddoc ?? '',
      item.cserie ?? '',
      item.cnumero ?? '',
      item.ccodenti ?? 0,
      item.ccodruc ?? '',
      item.crazsoc ?? '',
      item.nbase1 ?? 0,
      item.nigv1 ?? 0,
      item.ntots ?? 0,
      item.ntc ?? 1,
      item.crefdoc ?? '',
      item.crefser ?? '',
      item.crefnum ?? '',
      item.cglosa ?? '',
    ])
  }

  const ws = utils.aoa_to_sheet(data)

  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 14 }, { wch: 35 },
    { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 30 },
  ]

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
  ]

  if (ws['A1']) ws['A1'].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } }
  if (ws['A3']) ws['A3'].s = { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center' } }

  applyStyles(ws, HEADER_ROW, DATA_START, DATA_START + items.length - 1, 16)

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'VENTAS')
  writeFile(wb, `${opts.nameFile ?? 'CONTASIS_VENTAS'}.xlsx`)
}

// ──────────────────────────────────────────────────────────────
// COMPRAS
// ──────────────────────────────────────────────────────────────
export function exportContasisComprasToExcel(
  items: ContasisCompraItem[],
  opts: { desde: string; hasta: string; empresa?: string; nameFile?: string },
) {
  const data: any[][] = []

  data.push([opts.empresa ?? 'MI EMPRESA'])
  data.push([`Período: ${opts.desde} al ${opts.hasta}`])
  data.push(['REGISTRO DE COMPRAS — FORMATO CONTASIS'])
  data.push([])

  const HEADER_ROW = 4
  data.push([
    'ffechadoc', 'ccoddoc', 'cserie', 'cnumero',
    'ccodenti', 'ccodruc', 'crazsoc',
    'nbase1', 'nigv1', 'nina', 'ntots', 'ntc', 'percepcion',
  ])

  const DATA_START = 5
  for (const item of items) {
    data.push([
      item.ffechadoc ?? '',
      item.ccoddoc ?? '',
      item.cserie ?? '',
      item.cnumero ?? '',
      item.ccodenti ?? 0,
      item.ccodruc ?? '',
      item.crazsoc ?? '',
      item.nbase1 ?? 0,
      item.nigv1 ?? 0,
      item.nina ?? 0,
      item.ntots ?? 0,
      item.ntc ?? 1,
      item.percepcion ?? 0,
    ])
  }

  const ws = utils.aoa_to_sheet(data)

  ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
    { wch: 8 }, { wch: 14 }, { wch: 35 },
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 10 },
  ]

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
  ]

  if (ws['A1']) ws['A1'].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } }
  if (ws['A3']) ws['A3'].s = { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center' } }

  applyStyles(ws, HEADER_ROW, DATA_START, DATA_START + items.length - 1, 13)

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'COMPRAS')
  writeFile(wb, `${opts.nameFile ?? 'CONTASIS_COMPRAS'}.xlsx`)
}
