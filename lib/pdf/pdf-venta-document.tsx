import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { VentaConRelaciones } from './generar-pdf-venta'

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
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  documentNumber: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  clienteBox: {
    border: "0.5px solid #fadc06",
    marginBottom: 10,
  },
  clienteRow: {
    flexDirection: "row",
    minHeight: 18,
  },
  clienteCellLeft: {
    width: "12%",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
  },
  clienteCellValueLeft: {
    width: "38%",
    padding: 4,
    fontSize: 7,
  },
  clienteCellRight: {
    width: "15%",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
  },
  clienteCellValueRight: {
    width: "35%",
    padding: 4,
    fontSize: 7,
  },
  introText: {
    fontSize: 7,
    marginBottom: 8,
    marginTop: 5,
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
  colUbi: { width: "5%", textAlign: "center" },
  colCodigo: { width: "10%", textAlign: "center" },
  colCant: { width: "7%", textAlign: "center" },
  colUnidad: { width: "8%", textAlign: "center" },
  colDescripcion: { width: "40%", textAlign: "left" },
  colPrecio: { width: "10%", textAlign: "right" },
  colDesc: { width: "7%", textAlign: "right" },
  colImporte: { width: "8%", textAlign: "right", borderRight: "none" },
  sonRow: {
    padding: 6,
    fontSize: 7,
    fontWeight: "bold",
  },
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
  totalRowLast: {
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
})

export default function PDFVentaDocument({
  venta,
  logoDataURI,
}: {
  venta: VentaConRelaciones;
  logoDataURI: string;
}) {
  // Obtener datos de la empresa
  const empresa = venta.user.empresa as any

  // Calcular productos
  const productos = venta.productos_por_almacen.flatMap((pa) =>
    pa.unidades_derivadas.map((ud) => ({
      codigo: pa.producto_almacen.producto.cod_producto || "",
      nombre: pa.producto_almacen.producto.name,
      marca: pa.producto_almacen.producto.marca.name,
      unidad: ud.unidad_derivada_inmutable.name,
      cantidad: Number(ud.cantidad),
      precio: Number(ud.precio),
      descuento: Number(ud.descuento || 0),
      subtotal: Number(ud.cantidad) * Number(ud.factor) * Number(ud.precio),
    }))
  )

  const subtotal = productos.reduce((sum: number, p: any) => sum + p.subtotal, 0)
  const totalDescuento = productos.reduce((sum: number, p: any) => sum + p.descuento, 0)
  const igv = (subtotal - totalDescuento) * 0.18
  const total = subtotal - totalDescuento + igv

  const clienteNombre =
    venta.cliente?.razon_social ||
    `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim() ||
    'CLIENTES VARIOS'

  const fechaEmision = new Date(venta.fecha)

  const formatFecha = (fecha: Date) => {
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = String(fecha.getFullYear()).slice(-2);
    return `${dia}/${mes}/${anio}`;
  }

  const formatHora = (fecha: Date) => {
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${horas}:${minutos}:00`;
  }

  // Determinar el título del documento
  const getTituloDocumento = () => {
    switch (venta.tipo_documento) {
      case 'Factura':
        return 'FACTURA ELECTRÓNICA'
      case 'Boleta':
        return 'BOLETA DE VENTA'
      case 'NotaDeVenta':
        return 'NOTA DE VENTA'
      default:
        return venta.tipo_documento.toUpperCase()
    }
  }

  // Formatear número de comprobante
  const numeroComprobante = `${venta.serie || 'S/N'}-${String(venta.numero || 0).padStart(8, '0')}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
              <Text style={styles.rucText}>R.U.C {empresa?.ruc || '20611539160'}</Text>
              <Text style={styles.documentTitle}>{getTituloDocumento()}</Text>
              <Text style={styles.documentNumber}>{numeroComprobante}</Text>
            </View>
          </View>
        </View>

        <View style={styles.clienteBox}>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Cliente</Text>
            <Text style={styles.clienteCellValueLeft}>: {clienteNombre}</Text>
            <Text style={styles.clienteCellRight}>F. Emisión</Text>
            <Text style={styles.clienteCellValueRight}>
              : {formatFecha(fechaEmision)}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Dirección</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {venta.cliente?.direccion || ""}
            </Text>
            <Text style={styles.clienteCellRight}>Hora</Text>
            <Text style={styles.clienteCellValueRight}>
              : {formatHora(fechaEmision)}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>RUC / DNI</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {venta.cliente?.numero_documento || ""}
            </Text>
            <Text style={styles.clienteCellRight}>Tipo Doc.</Text>
            <Text style={styles.clienteCellValueRight}>
              : {venta.tipo_documento}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Vendedor</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {venta.user.name}
            </Text>
            <Text style={styles.clienteCellRight}>Almacén</Text>
            <Text style={styles.clienteCellValueRight}>: {venta.almacen.name}</Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Forma Pago</Text>
            <Text style={styles.clienteCellValueLeft}>: {venta.forma_de_pago}</Text>
            <Text style={styles.clienteCellRight}>Moneda</Text>
            <Text style={styles.clienteCellValueRight}>: SOLES</Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Cajero</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {venta.user.name}
            </Text>
            <Text style={styles.clienteCellRight}>Estado</Text>
            <Text style={styles.clienteCellValueRight}>: {venta.estado_de_venta}</Text>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colItem]}>ITEM.</Text>
            <Text style={[styles.tableCell, styles.colUbi]}>UBI.</Text>
            <Text style={[styles.tableCell, styles.colCodigo]}>CÓDIGO</Text>
            <Text style={[styles.tableCell, styles.colCant]}>CANT.</Text>
            <Text style={[styles.tableCell, styles.colUnidad]}>UNIDAD</Text>
            <Text style={[styles.tableCell, styles.colDescripcion]}>
              DESCRIPCIÓN
            </Text>
            <Text style={[styles.tableCell, styles.colPrecio]}>P. UNI.</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>DESC.</Text>
            <Text style={[styles.tableCell, styles.colImporte]}>IMPORTE</Text>
          </View>

          {productos.map((producto: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colItem]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, styles.colUbi]}>A1</Text>
              <Text style={[styles.tableCell, styles.colCodigo]}>
                {producto.codigo}
              </Text>
              <Text style={[styles.tableCell, styles.colCant]}>
                {producto.cantidad.toFixed(0)}
              </Text>
              <Text style={[styles.tableCell, styles.colUnidad]}>
                {producto.unidad}
              </Text>
              <Text style={[styles.tableCell, styles.colDescripcion]}>
                {producto.nombre}
              </Text>
              <Text style={[styles.tableCell, styles.colPrecio]}>
                {producto.precio.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.colDesc]}>
                {producto.descuento.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.colImporte]}>
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

          <View style={styles.sonRow}>
            <Text>SON: {convertirNumeroALetras(total)} SOLES.</Text>
          </View>
        </View>

        {/* Sección de observaciones y totales */}
        <View style={styles.bottomRow}>
          <View style={styles.observacionesCell}>
            <View style={styles.observacionesBox}>
              <Text style={styles.observacionesTitle}>OBSERVACIONES</Text>
              <Text style={styles.observacionesList}>
                {venta.descripcion || "- NINGUNA"}
              </Text>
            </View>
          </View>

          <View style={styles.totalesCell}>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>SUBTOTAL</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>
                  {(subtotal - totalDescuento).toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>IGV (18%)</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>{igv.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.totalRowLast}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>TOTAL</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          <Text style={styles.footerBold}>
            ¡GRACIAS POR SU PREFERENCIA! ¡DIOS LES BENDIGA!
          </Text>
        </Text>
      </Page>
    </Document>
  )
}

// Función auxiliar para convertir números a letras (simplificada)
function convertirNumeroALetras(num: number): string {
  // Implementación simple - puedes mejorar esto
  const entero = Math.floor(num)
  const decimal = Math.round((num - entero) * 100)
  return `${entero.toFixed(0)} CON ${decimal}/100`
}
