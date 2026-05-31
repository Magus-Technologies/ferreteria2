import { utils, writeFile } from 'xlsx-js-style'
import dayjs from 'dayjs'

export interface EmpresaInfo {
  razon_social?: string
  ruc?: string
  direccion?: string
}

interface GuiaItem {
  id?: string
  serie?: string
  numero?: string
  fecha_emision?: string
  fecha_traslado?: string
  estado?: string
  tipo_guia?: string
  modalidad_transporte?: string
  punto_partida?: string
  punto_llegada?: string
  referencia?: string
  venta?: { serie?: string; numero?: string } | null
  cliente?: { razon_social?: string; nombres?: string; apellidos?: string; numero_documento?: string } | null
  motivoTraslado?: { descripcion?: string } | null
  almacenOrigen?: { name?: string } | null
  almacenDestino?: { name?: string } | null
  chofer?: { name?: string; dni?: string } | null
}

interface ExportParams {
  items: GuiaItem[]
  nameFile: string
  fechaDesde?: string
  fechaHasta?: string
  empresa?: EmpresaInfo
}

export function exportReporteGuiasToExcel({ items, nameFile, fechaDesde, fechaHasta, empresa }: ExportParams) {
  if (!items || items.length === 0) return

  const data: any[][] = []

  data.push([empresa?.razon_social || 'Mi Empresa'])
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', '', '', '', '', `Desde: ${fechaDesde || '—'}`])
  data.push([empresa?.direccion || '', '', '', '', '', '', `Hasta: ${fechaHasta || '—'}`])
  data.push(['REPORTE DE GUÍAS DE REMISIÓN'])
  data.push([])

  data.push(['Serie-Número', 'F. Emisión', 'F. Traslado', 'Estado', 'Tipo', 'Modalidad', 'Cliente', 'Doc. Cliente', 'N° Venta', 'Motivo', 'Almacén Origen', 'Almacén Destino', 'Chofer'])

  for (const g of items) {
    const serieNum = g.serie && g.numero ? `${g.serie}-${g.numero}` : g.id || '—'
    const cliente = g.cliente?.razon_social
      || `${g.cliente?.nombres || ''} ${g.cliente?.apellidos || ''}`.trim()
      || '—'
    const ventaNum = g.venta?.serie && g.venta?.numero
      ? `${g.venta.serie}-${g.venta.numero}` : '—'

    data.push([
      serieNum,
      g.fecha_emision ? dayjs(g.fecha_emision).format('DD/MM/YYYY') : '—',
      g.fecha_traslado ? dayjs(g.fecha_traslado).format('DD/MM/YYYY') : '—',
      g.estado || '—',
      g.tipo_guia || '—',
      g.modalidad_transporte || '—',
      cliente,
      g.cliente?.numero_documento || '—',
      ventaNum,
      g.motivoTraslado?.descripcion || '—',
      g.almacenOrigen?.name || '—',
      g.almacenDestino?.name || '—',
      g.chofer?.name || '—',
    ])
  }

  const ws = utils.aoa_to_sheet(data)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Guías')

  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
  ]

  writeFile(wb, `${nameFile}.xlsx`)
}
