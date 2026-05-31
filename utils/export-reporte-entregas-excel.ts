import { utils, writeFile } from 'xlsx-js-style'
import dayjs from 'dayjs'

export interface EmpresaInfo {
  razon_social?: string
  ruc?: string
  direccion?: string
}

interface EntregaReporteItem {
  id: number
  venta_numero?: string
  cliente?: string
  chofer?: string
  estado_nombre?: string
  tipo_entrega_nombre?: string
  fecha_creacion?: string
  fecha_programada?: string
  fecha_ejecutada?: string
  direccion_entrega?: string
  tipo_pedido?: string
}

interface ResumenEntregas {
  total: number
  pendientes: number
  en_camino: number
  entregadas: number
  canceladas: number
  en_tienda: number
  domicilio: number
  parciales: number
}

interface ExportParams {
  items: EntregaReporteItem[]
  resumen?: ResumenEntregas
  nameFile: string
  fechaDesde?: string
  fechaHasta?: string
  empresa?: EmpresaInfo
}

export function exportReporteEntregasToExcel({ items, resumen, nameFile, fechaDesde, fechaHasta, empresa }: ExportParams) {
  if (!items || items.length === 0) return

  const data: any[][] = []

  data.push([empresa?.razon_social || 'Mi Empresa'])
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', '', '', '', '', `Desde: ${fechaDesde || '—'}`])
  data.push([empresa?.direccion || '', '', '', '', '', '', `Hasta: ${fechaHasta || '—'}`])
  data.push(['REPORTE DE ENTREGAS'])
  data.push([])

  data.push(['N° Venta', 'Cliente', 'Tipo', 'Estado', 'Chofer', 'Dirección', 'F. Creación', 'F. Programada', 'F. Ejecutada', 'Tipo Pedido'])

  for (const item of items) {
    data.push([
      item.venta_numero || '—',
      item.cliente || '—',
      item.tipo_entrega_nombre || '—',
      item.estado_nombre || '—',
      item.chofer || '—',
      item.direccion_entrega || '—',
      item.fecha_creacion ? dayjs(item.fecha_creacion).format('DD/MM/YYYY') : '—',
      item.fecha_programada ? dayjs(item.fecha_programada).format('DD/MM/YYYY') : '—',
      item.fecha_ejecutada ? dayjs(item.fecha_ejecutada).format('DD/MM/YYYY HH:mm') : '—',
      item.tipo_pedido || '—',
    ])
  }

  if (resumen) {
    data.push([])
    data.push(['RESUMEN'])
    data.push(['Total Entregas', resumen.total])
    data.push(['Pendientes', resumen.pendientes])
    data.push(['En Camino', resumen.en_camino])
    data.push(['Entregadas', resumen.entregadas])
    data.push(['Canceladas', resumen.canceladas])
    data.push([])
    data.push(['En Tienda', resumen.en_tienda])
    data.push(['Domicilio', resumen.domicilio])
    data.push(['Parciales', resumen.parciales])
  }

  const ws = utils.aoa_to_sheet(data)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Entregas')

  ws['!cols'] = [
    { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
    { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
  ]

  writeFile(wb, `${nameFile}.xlsx`)
}
