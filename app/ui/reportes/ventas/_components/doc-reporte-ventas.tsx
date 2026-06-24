import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { GananciaDetalle, ResumenGanancias } from '~/lib/api/ganancias'

export type EmpresaInfoPdf = {
  razon_social?: string
  ruc?: string
  direccion?: string
}

type Props = {
  items: GananciaDetalle[]
  resumen?: ResumenGanancias
  titulo: string
  fechaDesde: string
  fechaHasta: string
  empresa?: EmpresaInfoPdf
}

const C = {
  azul: '#1e40af',
  azulOsc: '#1e3a5f',
  gris: '#374151',
  grisClaro: '#6b7280',
  borde: '#e5e7eb',
  filaAlt: '#f8fafc',
  cabFila: '#dbeafe',
  total: '#fef9c3',
  verde: '#16a34a',
  rojo: '#dc2626',
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    fontSize: 8,
    color: C.gris,
    backgroundColor: 'white',
    fontFamily: 'Helvetica',
  },
  // Cabecera
  empresa: { fontSize: 13, fontWeight: 'bold', color: C.azulOsc },
  empresaMeta: { fontSize: 8, color: C.gris, marginTop: 2 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fechasBox: { alignItems: 'flex-end' },
  fechaLine: { fontSize: 8, fontWeight: 'bold', color: C.gris },
  titulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C.azul,
    marginTop: 10,
    marginBottom: 8,
  },
  // Tabla
  thead: {
    flexDirection: 'row',
    backgroundColor: C.azul,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 7,
  },
  invoiceRow: {
    flexDirection: 'row',
    backgroundColor: C.cabFila,
    color: C.azulOsc,
    fontWeight: 'bold',
    fontSize: 7.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#bfdbfe',
  },
  productRow: {
    flexDirection: 'row',
    fontSize: 7.5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borde,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: C.total,
    fontWeight: 'bold',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#f59e0b',
  },
  cell: { paddingHorizontal: 4, paddingVertical: 3 },
  right: { textAlign: 'right' },
  center: { textAlign: 'center' },
  // Resumen
  resumenTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: C.azulOsc,
    marginTop: 14,
    marginBottom: 6,
  },
  resumenRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.borde,
  },
  resumenLabel: {
    width: 160,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 8,
  },
  resumenValue: {
    width: 110,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 8,
    fontWeight: 'bold',
    color: C.azul,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: C.grisClaro,
  },
})

// Anchos de columna (suman 100)
const W = {
  num: '4%',
  fecha: '9%',
  tdoc: '6%',
  numero: '13%',
  cliente: '21%',
  vendedor: '13%',
  producto: '14%',
  cant: '5%',
  punit: '5%',
  subtot: '5%',
  costo: '5%',
  ganancia: '5%',
}

function fmt(val?: number) {
  return Number(val ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function groupByInvoice(items: GananciaDetalle[]): GananciaDetalle[][] {
  const groups = new Map<string, GananciaDetalle[]>()
  for (const item of items) {
    const key = item.numero ?? item.id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return Array.from(groups.values())
}

export default function DocReporteVentas({
  items,
  resumen,
  titulo,
  fechaDesde,
  fechaHasta,
  empresa,
}: Props) {
  const groups = groupByInvoice(items)

  let totalSubtot = 0
  let totalCosto = 0
  let totalGanancia = 0
  for (const item of items) {
    totalSubtot += Number(item.subtot ?? 0)
    totalCosto += Number(item.costo_total ?? 0)
    totalGanancia += Number(item.ganancia ?? 0)
  }

  const fpagoLabel = (f?: string) =>
    f === 'co' || f === 'CO'
      ? 'Contado'
      : f === 'cr' || f === 'CR'
        ? 'Crédito'
        : (f ?? '')

  return (
    <Document title={titulo}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.empresa}>{empresa?.razon_social ?? 'Mi Empresa'}</Text>
            {empresa?.ruc ? <Text style={styles.empresaMeta}>RUC: {empresa.ruc}</Text> : null}
            {empresa?.direccion ? (
              <Text style={styles.empresaMeta}>{empresa.direccion}</Text>
            ) : null}
          </View>
          <View style={styles.fechasBox}>
            <Text style={styles.fechaLine}>Fecha Desde: {fechaDesde}</Text>
            <Text style={styles.fechaLine}>Hasta: {fechaHasta}</Text>
          </View>
        </View>

        <Text style={styles.titulo}>{titulo}</Text>

        {/* Encabezado de tabla */}
        <View style={styles.thead} fixed>
          <Text style={[styles.cell, styles.center, { width: W.num }]}>#</Text>
          <Text style={[styles.cell, { width: W.fecha }]}>Fecha</Text>
          <Text style={[styles.cell, { width: W.tdoc }]}>T.Doc</Text>
          <Text style={[styles.cell, { width: W.numero }]}>Número</Text>
          <Text style={[styles.cell, { width: W.cliente }]}>Cliente</Text>
          <Text style={[styles.cell, { width: W.vendedor }]}>Vendedor</Text>
          <Text style={[styles.cell, { width: W.producto }]}>Descripción</Text>
          <Text style={[styles.cell, styles.right, { width: W.cant }]}>Cant.</Text>
          <Text style={[styles.cell, styles.right, { width: W.punit }]}>P.Unit</Text>
          <Text style={[styles.cell, styles.right, { width: W.subtot }]}>Subtot.</Text>
          <Text style={[styles.cell, styles.right, { width: W.costo }]}>Costo</Text>
          <Text style={[styles.cell, styles.right, { width: W.ganancia }]}>Ganan.</Text>
        </View>

        {/* Filas agrupadas por comprobante */}
        {groups.map((lines, gi) => {
          const first = lines[0]
          const sumSubt = lines.reduce((a, l) => a + Number(l.subtot ?? 0), 0)
          const sumCosto = lines.reduce((a, l) => a + Number(l.costo_total ?? 0), 0)
          const sumGan = lines.reduce((a, l) => a + Number(l.ganancia ?? 0), 0)

          return (
            <View key={`${first.numero}-${gi}`} wrap={false}>
              {/* Cabecera del comprobante */}
              <View style={styles.invoiceRow}>
                <Text style={[styles.cell, styles.center, { width: W.num }]}>{gi + 1}</Text>
                <Text style={[styles.cell, { width: W.fecha }]}>{first.fecha ?? ''}</Text>
                <Text style={[styles.cell, { width: W.tdoc }]}>{first.tipo_doc ?? ''}</Text>
                <Text style={[styles.cell, { width: W.numero }]}>{first.numero ?? ''}</Text>
                <Text style={[styles.cell, { width: W.cliente }]}>{first.cliente ?? ''}</Text>
                <Text style={[styles.cell, { width: W.vendedor }]}>{first.vendedor ?? ''}</Text>
                <Text style={[styles.cell, { width: W.producto }]}>{fpagoLabel(first.f_pago)}</Text>
                <Text style={[styles.cell, styles.right, { width: W.cant }]}></Text>
                <Text style={[styles.cell, styles.right, { width: W.punit }]}></Text>
                <Text style={[styles.cell, styles.right, { width: W.subtot }]}>{fmt(sumSubt)}</Text>
                <Text style={[styles.cell, styles.right, { width: W.costo }]}>{fmt(sumCosto)}</Text>
                <Text style={[styles.cell, styles.right, { width: W.ganancia }]}>{fmt(sumGan)}</Text>
              </View>

              {/* Sub-filas de productos */}
              {lines.map((line, li) => {
                const g = Number(line.ganancia ?? 0)
                return (
                  <View
                    key={`${first.numero}-${gi}-${li}`}
                    style={[
                      styles.productRow,
                      { backgroundColor: li % 2 === 0 ? '#ffffff' : C.filaAlt },
                    ]}
                  >
                    <Text style={[styles.cell, { width: W.num }]}></Text>
                    <Text style={[styles.cell, { width: W.fecha }]}></Text>
                    <Text style={[styles.cell, { width: W.tdoc }]}></Text>
                    <Text style={[styles.cell, { width: W.numero }]}></Text>
                    <Text style={[styles.cell, { width: W.cliente }]}></Text>
                    <Text style={[styles.cell, { width: W.vendedor }]}></Text>
                    <Text style={[styles.cell, { width: W.producto }]}>{line.producto ?? ''}</Text>
                    <Text style={[styles.cell, styles.right, { width: W.cant }]}>{fmt(line.cant)}</Text>
                    <Text style={[styles.cell, styles.right, { width: W.punit }]}>{fmt(line.p_unit)}</Text>
                    <Text style={[styles.cell, styles.right, { width: W.subtot }]}>{fmt(line.subtot)}</Text>
                    <Text style={[styles.cell, styles.right, { width: W.costo }]}>{fmt(line.costo_total)}</Text>
                    <Text
                      style={[
                        styles.cell,
                        styles.right,
                        { width: W.ganancia, color: g >= 0 ? C.verde : C.rojo },
                      ]}
                    >
                      {fmt(g)}
                    </Text>
                  </View>
                )
              })}
            </View>
          )
        })}

        {/* Totales */}
        <View style={styles.totalRow} wrap={false}>
          <Text style={[styles.cell, { width: W.num }]}>TOTALES</Text>
          <Text style={[styles.cell, { width: W.fecha }]}></Text>
          <Text style={[styles.cell, { width: W.tdoc }]}></Text>
          <Text style={[styles.cell, { width: W.numero }]}></Text>
          <Text style={[styles.cell, { width: W.cliente }]}></Text>
          <Text style={[styles.cell, { width: W.vendedor }]}></Text>
          <Text style={[styles.cell, { width: W.producto }]}></Text>
          <Text style={[styles.cell, styles.right, { width: W.cant }]}></Text>
          <Text style={[styles.cell, styles.right, { width: W.punit }]}></Text>
          <Text style={[styles.cell, styles.right, { width: W.subtot }]}>{fmt(totalSubtot)}</Text>
          <Text style={[styles.cell, styles.right, { width: W.costo }]}>{fmt(totalCosto)}</Text>
          <Text style={[styles.cell, styles.right, { width: W.ganancia }]}>{fmt(totalGanancia)}</Text>
        </View>

        {/* Resumen */}
        {resumen ? (
          <View wrap={false}>
            <Text style={styles.resumenTitle}>RESUMEN</Text>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Total Ventas (S/.)</Text>
              <Text style={styles.resumenValue}>{fmt(resumen.ventas)}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Costo Total (S/.)</Text>
              <Text style={styles.resumenValue}>{fmt(resumen.costo)}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Ganancia Bruta (S/.)</Text>
              <Text style={styles.resumenValue}>{fmt(resumen.ganancia)}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Total Transacciones</Text>
              <Text style={styles.resumenValue}>{resumen.total_transacciones}</Text>
            </View>
          </View>
        ) : null}

        {/* Pie de página */}
        <View style={styles.footer} fixed>
          <Text>Generado: {new Date().toLocaleString('es-PE')}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
