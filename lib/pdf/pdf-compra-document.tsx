import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { CompraConRelaciones } from './generar-pdf-compra'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  logoSection: {
    width: "55%",
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 100,
    marginRight: 15,
  },
  companyInfo: {
    fontSize: 7,
    color: "#000",
    lineHeight: 1.4,
    paddingTop: 0,
    flex: 1,
  },
  companyName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },
  documentSection: {
    width: "45%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  documentBox: {
    border: "0.5px solid #fadc06",
    borderRadius: 12,
    padding: 12,
    width: 220,
  },
  rucText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  documentNumber: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  proveedorBox: {
    border: "0.5px solid #fadc06",
    marginBottom: 10,
  },
  proveedorRow: {
    flexDirection: "row",
    minHeight: 18,
  },
  proveedorCellLeft: {
    width: "12%",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
  },
  proveedorCellValueLeft: {
    width: "38%",
    padding: 4,
    fontSize: 7,
  },
  proveedorCellRight: {
    width: "15%",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
  },
  proveedorCellValueRight: {
    width: "35%",
    padding: 4,
    fontSize: 7,
  },
  tableContainer: {
    border: "2px solid #fadc06",
  },
  tableHeader: {
    flexDirection: "row",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
    borderBottom: "1px solid #fadc06",
    backgroundColor: "#fadc06",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #fadc06",
    minHeight: 20,
  },
  tableCell: {
    padding: 3,
    fontSize: 7,
    borderRight: "1px solid #fadc06",
  },
  colItem: { width: "5%", textAlign: "center" },
  colCodigo: { width: "10%", textAlign: "center" },
  colDescripcion: { width: "35%", textAlign: "left" },
  colMarca: { width: "12%", textAlign: "center" },
  colUnidad: { width: "8%", textAlign: "center" },
  colCant: { width: "8%", textAlign: "center" },
  colPrecio: { width: "10%", textAlign: "right" },
  colSubtotal: { width: "12%", textAlign: "right", borderRight: "none" },
  bottomRow: {
    flexDirection: "row",
    minHeight: 120,
  },
  observacionesCell: {
    width: "65%",
    padding: 15,
    borderRight: "1px solid #fff",
    justifyContent: "center",
  },
  observacionesBox: {
    border: "2px solid #fadc06",
    borderRadius: 8,
    padding: 8,
  },
  observacionesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 4,
  },
  observacionesList: {
    fontSize: 6,
    lineHeight: 1.5,
  },
  totalesCell: {
    width: "35%",
  },
  totalRow: {
    flexDirection: "row",
    borderBottom: "1px solid #fadc06",
  },
  totalLabelCell: {
    width: "60%",
    borderRight: "1px solid #fadc06",
    borderLeft: "1px solid #fadc06",
    padding: 6,
  },
  totalLabelText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "right",
  },
  totalValueCell: {
    width: "40%",
    padding: 6,
    borderRight: "1px solid #fadc06",
  },
  totalValueText: {
    fontSize: 8,
    textAlign: "right",
  },
  footerText: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 15,
    marginBottom: 10,
  },
  footerBold: {
    fontWeight: "bold",
  },
  deudaBox: {
    marginTop: 10,
    padding: 8,
    border: "1px solid #fadc06",
    borderRadius: 4,
  },
  deudaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  deudaLabel: {
    fontSize: 8,
    fontWeight: "bold",
  },
  deudaValue: {
    fontSize: 8,
  },
})

export default function PDFCompraDocument({
  compra,
  logoDataURI,
}: {
  compra: CompraConRelaciones;
  logoDataURI: string;
}) {
  // Obtener datos de la empresa
  const empresa = compra.user.empresa as any

  // Calcular productos
  const productos = compra.productos_por_almacen.flatMap((pa) =>
    pa.unidades_derivadas.map((ud) => {
      const costo = Number(pa.costo)
      const cantidad = Number(ud.cantidad)
      const factor = Number(ud.factor)
      return {
        codigo: pa.producto_almacen.producto.cod_producto || "",
        nombre: pa.producto_almacen.producto.name,
        marca: pa.producto_almacen.producto.marca.name,
        unidad: ud.unidad_derivada_inmutable.name,
        cantidad: cantidad,
        precio: costo,
        subtotal: cantidad * factor * costo,
      }
    })
  )

  const subtotal = productos.reduce((sum: number, p: any) => sum + p.subtotal, 0)

  // Calcular deuda
  const totalPagado = compra.pagos_de_compras?.reduce(
    (sum, pago) => sum + Number(pago.monto),
    0
  ) || 0
  const deuda = subtotal - totalPagado

  const fechaEmision = new Date(compra.fecha)

  const formatFecha = (fecha: Date) => {
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  const formatHora = (fecha: Date) => {
    const horas = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    const segundos = String(fecha.getSeconds()).padStart(2, "0");
    const periodo = horas >= 12 ? "p. m." : "a. m.";
    const horas12 = horas % 12 || 12;
    return `${String(horas12).padStart(2, "0")}:${minutos}:${segundos} ${periodo}`;
  }

  // Formatear número de comprobante
  const numeroComprobante = `${compra.serie || '001'}-${String(compra.numero || 0).padStart(6, '0')}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            {logoDataURI && (
              <Image
                src={logoDataURI}
                style={styles.logo}
              />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{empresa?.razon_social || 'GRUPO MI REDENTOR S.A.C'}</Text>
              <Text>{empresa?.direccion || 'CAL.SINCHI ROCA MZA. 6 LOTE. 15 P.J.'}</Text>
              <Text>{empresa?.distrito || 'EL MILAGRO (SECTOR III)'}</Text>
              <Text>{"\n"}Cel: {empresa?.celular || '908846540 / 952686345'}</Text>
              <Text>{"\n"}Email: {empresa?.email || 'grupomiredentorsac@gmail.com'}</Text>
            </View>
          </View>

          <View style={styles.documentSection}>
            <View style={styles.documentBox}>
              <Text style={styles.documentTitle}>VISTA PREVIA DE</Text>
              <Text style={styles.documentTitle}>FACTURA DE COMPRAS</Text>
            </View>
          </View>
        </View>

        {/* Información del Proveedor */}
        <View style={styles.proveedorBox}>
          <View style={styles.proveedorRow}>
            <Text style={styles.proveedorCellLeft}>FACTURA</Text>
            <Text style={styles.proveedorCellValueLeft}>: {compra.tipo_documento}</Text>
            <Text style={styles.proveedorCellRight}>FECHA</Text>
            <Text style={styles.proveedorCellValueRight}>
              : {formatFecha(fechaEmision)} {formatHora(fechaEmision)}
            </Text>
          </View>

          <View style={styles.proveedorRow}>
            <Text style={styles.proveedorCellLeft}>PROVEEDOR</Text>
            <Text style={styles.proveedorCellValueLeft}>
              : {compra.proveedor?.ruc || ''} {compra.proveedor?.razon_social || ''}
            </Text>
            <Text style={styles.proveedorCellRight}>FORMA PAGO</Text>
            <Text style={styles.proveedorCellValueRight}>: {compra.forma_de_pago}</Text>
          </View>

          <View style={styles.proveedorRow}>
            <Text style={styles.proveedorCellLeft}>TOTAL PAGA</Text>
            <Text style={styles.proveedorCellValueLeft}>: {totalPagado.toFixed(2)}</Text>
            <Text style={styles.proveedorCellRight}>DEUDA</Text>
            <Text style={styles.proveedorCellValueRight}>: {deuda.toFixed(2)}</Text>
          </View>

          <View style={styles.proveedorRow}>
            <Text style={styles.proveedorCellLeft}>CUOTAS</Text>
            <Text style={styles.proveedorCellValueLeft}>: {compra.numero_dias || 0}</Text>
            <Text style={styles.proveedorCellRight}>PERIODO (Días)</Text>
            <Text style={styles.proveedorCellValueRight}>: </Text>
          </View>

          <View style={styles.proveedorRow}>
            <Text style={styles.proveedorCellLeft}></Text>
            <Text style={styles.proveedorCellValueLeft}></Text>
            <Text style={styles.proveedorCellRight}>Pago Letra (Cuota)</Text>
            <Text style={styles.proveedorCellValueRight}>: {(deuda / (compra.numero_dias || 1)).toFixed(2)}</Text>
          </View>
        </View>

        {/* Tabla de Productos */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colItem]}>ITEM</Text>
            <Text style={[styles.tableCell, styles.colCodigo]}>CÓDIGO</Text>
            <Text style={[styles.tableCell, styles.colDescripcion]}>DESCRIPCIÓN</Text>
            <Text style={[styles.tableCell, styles.colMarca]}>MARCA</Text>
            <Text style={[styles.tableCell, styles.colUnidad]}>U.Medida</Text>
            <Text style={[styles.tableCell, styles.colCant]}>Cantidad</Text>
            <Text style={[styles.tableCell, styles.colPrecio]}>Precio</Text>
            <Text style={[styles.tableCell, styles.colSubtotal]}>SubTotal</Text>
          </View>

          {productos.map((producto: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colItem]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, styles.colCodigo]}>
                {producto.codigo}
              </Text>
              <Text style={[styles.tableCell, styles.colDescripcion]}>
                {producto.nombre}
              </Text>
              <Text style={[styles.tableCell, styles.colMarca]}>
                {producto.marca}
              </Text>
              <Text style={[styles.tableCell, styles.colUnidad]}>
                {producto.unidad}
              </Text>
              <Text style={[styles.tableCell, styles.colCant]}>
                {producto.cantidad.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.colPrecio]}>
                {producto.precio.toFixed(5)}
              </Text>
              <Text style={[styles.tableCell, styles.colSubtotal]}>
                {producto.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Espacio vacío si hay pocos productos */}
          {productos.length < 10 && (
            <View
              style={{
                minHeight: (10 - productos.length) * 20,
                borderBottom: "1px solid #fadc06",
              }}
            />
          )}
        </View>

        {/* Sección de observaciones y totales */}
        <View style={styles.bottomRow}>
          <View style={styles.observacionesCell}>
            <View style={styles.observacionesBox}>
              <Text style={styles.observacionesTitle}>OBSERVACIONES</Text>
              <Text style={styles.observacionesList}>
                {compra.descripcion || "- NINGUNA"}
              </Text>
              <Text style={[styles.observacionesList, { marginTop: 8 }]}>
                Almacén: {compra.almacen.name}
              </Text>
              <Text style={styles.observacionesList}>
                Usuario: {compra.user.name}
              </Text>
              {compra.guia && (
                <Text style={styles.observacionesList}>
                  Guía: {compra.guia}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.totalesCell}>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>SUBTOTAL</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>
                  {(subtotal / 1.18).toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>IGV (18%)</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>{(subtotal - subtotal / 1.18).toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>TOTAL</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>{subtotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          <Text style={styles.footerBold}>
            DOCUMENTO GENERADO PARA CONTROL INTERNO
          </Text>
        </Text>
      </Page>
    </Document>
  )
}

