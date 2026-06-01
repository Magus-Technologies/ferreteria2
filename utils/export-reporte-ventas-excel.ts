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

export function exportReporteVentasToExcel({
  items,
  resumen,
  nameFile,
  fechaDesde,
  fechaHasta,
  empresa,
  titulo = 'REPORTE DE VENTAS',
}: ExportReporteVentasParams) {
  if (!items || items.length === 0) return

  const data: any[][] = []

  // Header
  data.push([empresa?.razon_social || 'Mi Empresa'])
  data.push([
    empresa?.ruc ? `RUC: ${empresa.ruc}` : '',
    '', '', '', '', '', '', '',
    `Fecha Desde: ${fechaDesde || dayjs().format('DD/MM/YYYY')}`,
  ])
  data.push([
    empresa?.direccion || '',
    '', '', '', '', '', '', '',
    `Hasta: ${fechaHasta || dayjs().format('DD/MM/YYYY')}`,
  ])
  data.push([titulo])
  data.push([])

  // Column headers
  data.push(['Fecha', 'T.Doc', 'Número', 'Cliente', 'Vendedor', 'Producto', 'Cant.', 'P.Unit', 'Subtotal', 'Costo', 'Ganancia', 'F.Pago'])

  let totalSubtotal = 0
  let totalCosto = 0
  let totalGanancia = 0

  for (const item of items) {
    data.push([
      item.fecha ? dayjs(item.fecha).format('DD/MM/YYYY') : '',
      item.tipo_doc || '',
      item.numero || '',
      item.cliente || '',
      item.vendedor || '',
      item.producto || '',
      Number(item.cant || 0),
      Number(item.p_unit || 0),
      Number(item.subtot || 0),
      Number(item.costo_total || 0),
      Number(item.ganancia || 0),
      item.f_pago || '',
    ])
    totalSubtotal += Number(item.subtot || 0)
    totalCosto += Number(item.costo_total || 0)
    totalGanancia += Number(item.ganancia || 0)
  }

  // Totals row
  data.push([])
  data.push([
    'TOTALES', '', '', '', '', '',
    '', '',
    totalSubtotal,
    totalCosto,
    totalGanancia,
    '',
  ])

  if (resumen) {
    data.push([])
    data.push(['RESUMEN'])
    data.push(['Total Ventas (S/.)', resumen.ventas])
    data.push(['Costo Total (S/.)', resumen.costo])
    data.push(['Ganancia Bruta (S/.)', resumen.ganancia])
    data.push(['Total Transacciones', resumen.total_transacciones])
  }

  const ws = utils.aoa_to_sheet(data)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Ventas')

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 28 }, { wch: 20 },
    { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
  ]

  writeFile(wb, `${nameFile}.xlsx`)
}
