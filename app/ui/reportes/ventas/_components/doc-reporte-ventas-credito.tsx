import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { GananciaDetalle } from '~/lib/api/ganancias'
import type { EmpresaInfoPdf } from './doc-reporte-ventas'

type Props = {
  items: GananciaDetalle[]
  titulo: string
  fechaDesde: string
  fechaHasta: string
  empresa?: EmpresaInfoPdf
}

/**
 * PDF del reporte de VENTAS AL CRÉDITO.
 *
 * Documento aparte de `DocReporteVentas` (que es compartido por los demás tipos
 * de reporte y sí muestra costo/ganancia). Acá el cliente pidió:
 *  - el layout del "Reporte Cuentas Por Cobrar" (cabecera + sub-tabla por
 *    comprobante + fila de totales),
 *  - SIN costo ni ganancia,
 *  - colores de la empresa (amarillo).
 */

// Amarillo corporativo: #FADC06. El resto son derivados del MISMO matiz
// (más oscuro para bordes, más claros para rellenos) para que todo el reporte
// quede en la identidad de la empresa.
const C = {
  amarillo: '#FADC06',        // cabecera principal — amarillo corporativo
  amarilloBorde: '#C4AB05',   // borde: más oscuro, no desaparece al imprimir
  amarilloTenue: '#FCEC80',   // header de la sub-tabla de productos
  amarilloSuave: '#FEFBDB',   // relleno muy claro (fila del comprobante / totales)
  amarilloLinea: '#FDF4A8',   // separador interno entre productos
  texto: '#1F2937',
  textoSuave: '#6B7280',
}

// Anchos tabla principal (suman 100)
const W = {
  num: '4%',
  emision: '11%',
  venc: '11%',
  numero: '14%',
  cliente: '22%',
  moneda: '8%',
  pagado: '10%',
  porCobrar: '10%',
  total: '10%',
}

// Anchos sub-tabla de productos (suman 100)
const S = {
  desc: '52%',
  cant: '12%',
  punit: '18%',
  total: '18%',
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    fontSize: 8,
    color: C.texto,
    backgroundColor: 'white',
    fontFamily: 'Helvetica',
  },
  titulo: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Barra amarilla bajo el título (reemplaza el subrayado, se ve más prolijo).
  tituloBarra: {
    height: 3,
    backgroundColor: C.amarillo,
    borderRadius: 2,
    marginTop: 5,
    marginBottom: 12,
  },
  empresa: { fontSize: 9, fontWeight: 'bold' },
  empresaMeta: { fontSize: 7.5, color: C.textoSuave, marginTop: 1 },
  fechaLinea: { fontSize: 8, fontWeight: 'bold', marginBottom: 8 },

  thead: {
    flexDirection: 'row',
    backgroundColor: C.amarillo,
    fontWeight: 'bold',
    fontSize: 7.5,
    borderWidth: 1,
    borderColor: C.amarilloBorde,
    borderRadius: 2,
    marginBottom: 5,
  },
  // Cada comprobante es una "tarjeta" con borde amarillo.
  grupo: {
    marginBottom: 7,
    borderWidth: 1,
    borderColor: C.amarilloBorde,
    borderRadius: 2,
  },
  invoiceRow: {
    flexDirection: 'row',
    fontSize: 7.5,
    fontWeight: 'bold',
    backgroundColor: C.amarilloSuave,
    borderBottomWidth: 1,
    borderBottomColor: C.amarilloBorde,
  },
  subHead: {
    flexDirection: 'row',
    backgroundColor: C.amarilloTenue,
    fontWeight: 'bold',
    fontSize: 7.5,
    borderBottomWidth: 0.8,
    borderBottomColor: C.amarilloBorde,
  },
  subRow: {
    flexDirection: 'row',
    fontSize: 7.5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.amarilloLinea,
  },
  totalHeaderRow: {
    flexDirection: 'row',
    fontSize: 7,
    fontWeight: 'bold',
    backgroundColor: C.amarilloTenue,
    borderWidth: 1,
    borderColor: C.amarilloBorde,
    borderBottomWidth: 0,
    borderRadius: 0,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    fontWeight: 'bold',
    fontSize: 9,
    paddingVertical: 3,
    backgroundColor: C.amarilloSuave,
    borderWidth: 1,
    borderColor: C.amarilloBorde,
    borderTopWidth: 0,
    borderRadius: 0,
  },
  totalLabel: { textAlign: 'right', letterSpacing: 0.5 },

  cell: { paddingHorizontal: 3, paddingVertical: 3.5 },
  right: { textAlign: 'right' },
  center: { textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: C.textoSuave,
  },
})

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

export default function DocReporteVentasCredito({
  items,
  titulo,
  fechaDesde,
  fechaHasta,
  empresa,
}: Props) {
  const groups = groupByInvoice(items)

  let sumPagado = 0
  let sumPorCobrar = 0
  let sumTotal = 0
  for (const lines of groups) {
    const totalComp = lines.reduce((a, l) => a + Number(l.subtot ?? 0), 0)
    // total_pagado viene por venta (repetido en cada línea): tomar el de la
    // primera, NO sumar las líneas, o se multiplicaría por la cantidad de items.
    const pagado = Number(lines[0]?.total_pagado ?? 0)
    sumTotal += totalComp
    sumPagado += pagado
    sumPorCobrar += Math.max(0, totalComp - pagado)
  }

  const CabeceraTabla = (
    <View style={styles.thead} fixed>
      <Text style={[styles.cell, styles.center, { width: W.num }]}>#</Text>
      <Text style={[styles.cell, styles.center, { width: W.emision }]}>Fecha Emisión</Text>
      <Text style={[styles.cell, styles.center, { width: W.venc }]}>Fecha Vencimiento</Text>
      <Text style={[styles.cell, styles.center, { width: W.numero }]}>Número</Text>
      <Text style={[styles.cell, styles.center, { width: W.cliente }]}>Cliente</Text>
      <Text style={[styles.cell, styles.center, { width: W.moneda }]}>Moneda</Text>
      <Text style={[styles.cell, styles.center, { width: W.pagado }]}>Total pagado</Text>
      <Text style={[styles.cell, styles.center, { width: W.porCobrar }]}>Por cobrar</Text>
      <Text style={[styles.cell, styles.center, { width: W.total }]}>Total</Text>
    </View>
  )

  return (
    <Document title={titulo}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={styles.tituloBarra} />

        {empresa?.razon_social ? (
          <View>
            <Text style={styles.empresa}>{empresa.razon_social}</Text>
            {empresa.ruc ? <Text style={styles.empresaMeta}>RUC: {empresa.ruc}</Text> : null}
          </View>
        ) : null}

        <Text style={styles.fechaLinea}>
          Fecha: {fechaDesde} al {fechaHasta}
        </Text>

        {CabeceraTabla}

        {groups.map((lines, gi) => {
          const first = lines[0]
          const totalComp = lines.reduce((a, l) => a + Number(l.subtot ?? 0), 0)
          const pagado = Number(first.total_pagado ?? 0)
          const porCobrar = Math.max(0, totalComp - pagado)

          return (
            <View key={`${first.numero}-${gi}`} style={styles.grupo} wrap={false}>
              {/* Fila del comprobante */}
              <View style={styles.invoiceRow}>
                <Text style={[styles.cell, styles.center, { width: W.num }]}>{gi + 1}</Text>
                <Text style={[styles.cell, styles.center, { width: W.emision }]}>{first.fecha ?? ''}</Text>
                <Text style={[styles.cell, styles.center, { width: W.venc }]}>{first.fecha_vencimiento ?? ''}</Text>
                <Text style={[styles.cell, styles.center, { width: W.numero }]}>{first.numero ?? ''}</Text>
                <Text style={[styles.cell, { width: W.cliente }]}>{first.cliente ?? ''}</Text>
                <Text style={[styles.cell, styles.center, { width: W.moneda }]}>{first.moneda ?? 'PEN'}</Text>
                <Text style={[styles.cell, styles.right, { width: W.pagado }]}>{fmt(pagado)}</Text>
                <Text style={[styles.cell, styles.right, { width: W.porCobrar }]}>{fmt(porCobrar)}</Text>
                <Text style={[styles.cell, styles.right, { width: W.total }]}>{fmt(totalComp)}</Text>
              </View>

              {/* Sub-tabla de productos del comprobante */}
              <View style={styles.subHead}>
                <Text style={[styles.cell, styles.center, { width: S.desc }]}>Descripción</Text>
                <Text style={[styles.cell, styles.center, { width: S.cant }]}>Cantidad</Text>
                <Text style={[styles.cell, styles.center, { width: S.punit }]}>Precio unit.</Text>
                <Text style={[styles.cell, styles.center, { width: S.total }]}>Total</Text>
              </View>
              {lines.map((line, li) => (
                <View key={`${first.numero}-${gi}-${li}`} style={styles.subRow}>
                  <Text style={[styles.cell, { width: S.desc }]}>{line.producto ?? ''}</Text>
                  <Text style={[styles.cell, styles.center, { width: S.cant }]}>{fmt(line.cant)}</Text>
                  <Text style={[styles.cell, styles.right, { width: S.punit }]}>{fmt(line.p_unit)}</Text>
                  <Text style={[styles.cell, styles.right, { width: S.total }]}>{fmt(line.subtot)}</Text>
                </View>
              ))}
            </View>
          )
        })}

        {/* Fila de títulos de los totales */}
        <View style={styles.totalHeaderRow} wrap={false}>
          <Text
            style={[
              styles.cell,
              { width: `${4 + 11 + 11 + 14 + 22 + 8}%` },
            ]}
          >
            {' '}
          </Text>
          <Text style={[styles.cell, styles.center, { width: W.pagado }]}>Total pagado</Text>
          <Text style={[styles.cell, styles.center, { width: W.porCobrar }]}>Por cobrar</Text>
          <Text style={[styles.cell, styles.center, { width: W.total }]}>Total</Text>
        </View>

        {/* Totales */}
        <View style={styles.totalRow} wrap={false}>
          <Text
            style={[
              styles.cell,
              styles.totalLabel,
              { width: `${4 + 11 + 11 + 14 + 22 + 8}%` },
            ]}
          >
            Totales
          </Text>
          <Text style={[styles.cell, styles.right, { width: W.pagado }]}>{fmt(sumPagado)}</Text>
          <Text style={[styles.cell, styles.right, { width: W.porCobrar }]}>{fmt(sumPorCobrar)}</Text>
          <Text style={[styles.cell, styles.right, { width: W.total }]}>{fmt(sumTotal)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>Generado: {new Date().toLocaleString('es-PE')}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
