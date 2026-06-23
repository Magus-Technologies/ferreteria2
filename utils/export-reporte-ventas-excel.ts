import { utils, writeFile } from 'xlsx-js-style'
import type { GananciaDetalle, ResumenGanancias } from '~/lib/api/ganancias'
import dayjs from 'dayjs'

export interface EmpresaInfo {
  razon_social?: string
  ruc?: string
  direccion?: string
}

interface ExportReporteVentasParams {
  items: GananciaDetalle[]
  resumen?: ResumenGanancias
  nameFile: string
  fechaDesde?: string
  fechaHasta?: string
  empresa?: EmpresaInfo
  titulo?: string
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const S = {
  companyName: {
    font: { bold: true, sz: 13, color: { rgb: '1e3a5f' } },
  },
  metaLabel: {
    font: { bold: true, sz: 10, color: { rgb: '374151' } },
  },
  metaValue: {
    font: { sz: 10, color: { rgb: '374151' } },
  },
  reportTitle: {
    font: { bold: true, sz: 12, color: { rgb: '1e40af' } },
  },
  colHeader: {
    fill: { fgColor: { rgb: '1e40af' } },
    font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    border: {
      top:    { style: 'thin', color: { rgb: 'FFFFFF' } },
      bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
      left:   { style: 'thin', color: { rgb: 'FFFFFF' } },
      right:  { style: 'thin', color: { rgb: 'FFFFFF' } },
    },
  },
  invoiceRow: {
    fill: { fgColor: { rgb: 'dbeafe' } },
    font: { bold: true, sz: 9, color: { rgb: '1e3a5f' } },
    alignment: { vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: 'bfdbfe' } },
      bottom: { style: 'thin', color: { rgb: 'bfdbfe' } },
      left:   { style: 'thin', color: { rgb: 'bfdbfe' } },
      right:  { style: 'thin', color: { rgb: 'bfdbfe' } },
    },
  },
  invoiceRowNum: {
    fill: { fgColor: { rgb: 'dbeafe' } },
    font: { bold: true, sz: 9, color: { rgb: '1e40af' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: 'bfdbfe' } },
      bottom: { style: 'thin', color: { rgb: 'bfdbfe' } },
      left:   { style: 'thin', color: { rgb: 'bfdbfe' } },
      right:  { style: 'thin', color: { rgb: 'bfdbfe' } },
    },
  },
  invoiceRowAmount: {
    fill: { fgColor: { rgb: 'dbeafe' } },
    font: { bold: true, sz: 9, color: { rgb: '1e3a5f' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: 'bfdbfe' } },
      bottom: { style: 'thin', color: { rgb: 'bfdbfe' } },
      left:   { style: 'thin', color: { rgb: 'bfdbfe' } },
      right:  { style: 'thin', color: { rgb: 'bfdbfe' } },
    },
  },
  productRow: {
    fill: { fgColor: { rgb: 'FFFFFF' } },
    font: { sz: 9, color: { rgb: '374151' } },
    alignment: { vertical: 'center' },
    border: {
      top:    { style: 'hair', color: { rgb: 'e5e7eb' } },
      bottom: { style: 'hair', color: { rgb: 'e5e7eb' } },
      left:   { style: 'hair', color: { rgb: 'e5e7eb' } },
      right:  { style: 'hair', color: { rgb: 'e5e7eb' } },
    },
  },
  productRowAmount: {
    fill: { fgColor: { rgb: 'FFFFFF' } },
    font: { sz: 9, color: { rgb: '374151' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top:    { style: 'hair', color: { rgb: 'e5e7eb' } },
      bottom: { style: 'hair', color: { rgb: 'e5e7eb' } },
      left:   { style: 'hair', color: { rgb: 'e5e7eb' } },
      right:  { style: 'hair', color: { rgb: 'e5e7eb' } },
    },
  },
  productRowProfit: (ganancia: number) => ({
    fill: { fgColor: { rgb: 'FFFFFF' } },
    font: { sz: 9, bold: false, color: { rgb: ganancia >= 0 ? '16a34a' : 'dc2626' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top:    { style: 'hair', color: { rgb: 'e5e7eb' } },
      bottom: { style: 'hair', color: { rgb: 'e5e7eb' } },
      left:   { style: 'hair', color: { rgb: 'e5e7eb' } },
      right:  { style: 'hair', color: { rgb: 'e5e7eb' } },
    },
  }),
  totalRow: {
    fill: { fgColor: { rgb: 'fef9c3' } },
    font: { bold: true, sz: 9, color: { rgb: '374151' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top:    { style: 'medium', color: { rgb: 'f59e0b' } },
      bottom: { style: 'medium', color: { rgb: 'f59e0b' } },
      left:   { style: 'thin',   color: { rgb: 'fde68a' } },
      right:  { style: 'thin',   color: { rgb: 'fde68a' } },
    },
  },
  totalRowLabel: {
    fill: { fgColor: { rgb: 'fef9c3' } },
    font: { bold: true, sz: 9, color: { rgb: '374151' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top:    { style: 'medium', color: { rgb: 'f59e0b' } },
      bottom: { style: 'medium', color: { rgb: 'f59e0b' } },
      left:   { style: 'thin',   color: { rgb: 'fde68a' } },
      right:  { style: 'thin',   color: { rgb: 'fde68a' } },
    },
  },
  resumenTitle: {
    font: { bold: true, sz: 10, color: { rgb: '1e3a5f' } },
  },
  resumenLabel: {
    fill: { fgColor: { rgb: 'f1f5f9' } },
    font: { sz: 9, color: { rgb: '374151' } },
    border: {
      top:    { style: 'hair', color: { rgb: 'e5e7eb' } },
      bottom: { style: 'hair', color: { rgb: 'e5e7eb' } },
      left:   { style: 'hair', color: { rgb: 'e5e7eb' } },
      right:  { style: 'hair', color: { rgb: 'e5e7eb' } },
    },
  },
  resumenValue: {
    fill: { fgColor: { rgb: 'f1f5f9' } },
    font: { bold: true, sz: 9, color: { rgb: '1e40af' } },
    alignment: { horizontal: 'right' },
    border: {
      top:    { style: 'hair', color: { rgb: 'e5e7eb' } },
      bottom: { style: 'hair', color: { rgb: 'e5e7eb' } },
      left:   { style: 'hair', color: { rgb: 'e5e7eb' } },
      right:  { style: 'hair', color: { rgb: 'e5e7eb' } },
    },
  },
}

function cell(v: any, s: object, t?: string) {
  const type = t ?? (typeof v === 'number' ? 'n' : 's')
  return { v, t: type, s }
}

function empty(s: object) {
  return { v: '', t: 's', s }
}

// ─── Agrupación por comprobante ───────────────────────────────────────────────

function groupByInvoice(items: GananciaDetalle[]): Map<string, GananciaDetalle[]> {
  const groups = new Map<string, GananciaDetalle[]>()
  for (const item of items) {
    const key = item.numero ?? item.id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return groups
}

// ─── Función principal ────────────────────────────────────────────────────────

export function exportReporteVentasToExcel({
  items,
  resumen,
  nameFile,
  fechaDesde,
  fechaHasta,
  empresa,
  titulo = 'REPORTE DE VENTAS',
}: ExportReporteVentasParams) {
  if (!items?.length) return

  const data: any[][] = []

  // ── Cabecera empresa ──
  const COL = 13  // total de columnas (A..M)
  const pad = (n: number) => Array(n).fill(empty(S.metaValue))

  data.push([cell(empresa?.razon_social ?? 'Mi Empresa', S.companyName), ...pad(COL - 1)])
  data.push([
    cell(empresa?.ruc ? `RUC: ${empresa.ruc}` : '', S.metaLabel),
    ...pad(7),
    cell(`Fecha Desde: ${fechaDesde ?? dayjs().format('DD/MM/YYYY')}`, S.metaLabel),
    ...pad(COL - 10),
  ])
  data.push([
    cell(empresa?.direccion ?? '', S.metaValue),
    ...pad(7),
    cell(`Hasta: ${fechaHasta ?? dayjs().format('DD/MM/YYYY')}`, S.metaLabel),
    ...pad(COL - 10),
  ])
  data.push([cell(titulo, S.reportTitle), ...pad(COL - 1)])
  data.push(pad(COL))

  // ── Encabezado de columnas ──
  const headers = ['#', 'Fecha', 'T.Doc', 'Número', 'Cliente', 'Vendedor', 'F.Pago', 'Descripción', 'Cant.', 'P.Unit', 'Subtotal', 'Costo', 'Ganancia']
  data.push(headers.map((h) => cell(h, S.colHeader)))

  // ── Filas de datos agrupadas ──
  const groups = groupByInvoice(items)
  let seq = 1
  let totalSubtot = 0
  let totalCosto  = 0
  let totalGanancia = 0

  for (const [, lines] of groups) {
    const first    = lines[0]
    const sumSubt  = lines.reduce((a, l) => a + Number(l.subtot    ?? 0), 0)
    const sumCosto = lines.reduce((a, l) => a + Number(l.costo_total ?? 0), 0)
    const sumGan   = lines.reduce((a, l) => a + Number(l.ganancia  ?? 0), 0)

    totalSubtot   += sumSubt
    totalCosto    += sumCosto
    totalGanancia += sumGan

    const fpago = first.f_pago === 'co' ? 'Contado' : first.f_pago === 'cr' ? 'Crédito' : (first.f_pago ?? '')

    // Fila cabecera del comprobante
    data.push([
      cell(seq++,                                             S.invoiceRowNum),
      // El backend ya entrega la fecha formateada como DD/MM/YYYY; usarla tal
      // cual evita el "Invalid Date" que producÃ­a dayjs(first.fecha).
      cell(first.fecha ?? '',                                 S.invoiceRow),
      cell(first.tipo_doc ?? '',                              S.invoiceRow),
      cell(first.numero   ?? '',                              S.invoiceRow),
      cell(first.cliente  ?? '',                              S.invoiceRow),
      cell(first.vendedor ?? '',                              S.invoiceRow),
      cell(fpago,                                             S.invoiceRow),
      empty(S.invoiceRow),
      empty(S.invoiceRow),
      empty(S.invoiceRow),
      cell(sumSubt,  S.invoiceRowAmount, 'n'),
      cell(sumCosto, S.invoiceRowAmount, 'n'),
      cell(sumGan,   S.invoiceRowAmount, 'n'),
    ])

    // Sub-filas de productos
    for (const line of lines) {
      const g = Number(line.ganancia ?? 0)
      data.push([
        empty(S.productRow),
        empty(S.productRow),
        empty(S.productRow),
        empty(S.productRow),
        empty(S.productRow),
        empty(S.productRow),
        empty(S.productRow),
        cell(line.producto  ?? '', S.productRow),
        cell(Number(line.cant    ?? 0), S.productRowAmount, 'n'),
        cell(Number(line.p_unit  ?? 0), S.productRowAmount, 'n'),
        cell(Number(line.subtot  ?? 0), S.productRowAmount, 'n'),
        cell(Number(line.costo_total ?? 0), S.productRowAmount, 'n'),
        cell(g, S.productRowProfit(g), 'n'),
      ])
    }
  }

  // ── Fila de totales ──
  data.push([
    cell('TOTALES', S.totalRowLabel),
    ...Array(9).fill(empty(S.totalRow)),
    cell(totalSubtot,    S.totalRow, 'n'),
    cell(totalCosto,     S.totalRow, 'n'),
    cell(totalGanancia,  S.totalRow, 'n'),
  ])

  // ── Resumen ──
  if (resumen) {
    data.push([])
    data.push([cell('RESUMEN', S.resumenTitle)])
    const resRows: [string, number][] = [
      ['Total Ventas (S/.)',    resumen.ventas],
      ['Costo Total (S/.)',     resumen.costo],
      ['Ganancia Bruta (S/.)', resumen.ganancia],
      ['Total Transacciones',  resumen.total_transacciones],
    ]
    for (const [label, val] of resRows) {
      data.push([cell(label, S.resumenLabel), cell(val, S.resumenValue, 'n')])
    }
  }

  // ── Crear hoja ──
  const ws = utils.aoa_to_sheet(data)

  // Anchos de columna
  ws['!cols'] = [
    { wch: 5  }, // #
    { wch: 12 }, // Fecha
    { wch: 7  }, // T.Doc
    { wch: 18 }, // Número
    { wch: 32 }, // Cliente
    { wch: 24 }, // Vendedor
    { wch: 9  }, // F.Pago
    { wch: 36 }, // Descripción
    { wch: 8  }, // Cant.
    { wch: 10 }, // P.Unit
    { wch: 12 }, // Subtotal
    { wch: 12 }, // Costo
    { wch: 12 }, // Ganancia
  ]

  // Alto de fila para encabezado de columnas (fila 6 = índice 5)
  ws['!rows'] = []
  ws['!rows'][5] = { hpt: 20 }

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Ventas')
  writeFile(wb, `${nameFile}.xlsx`)
}
