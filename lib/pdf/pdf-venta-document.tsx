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
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Header con logo y datos de empresa
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottom: '2px solid #f59e0b',
    paddingBottom: 15,
  },
  logoSection: {
    width: '50%',
  },
  logo: {
    width: 180,
    height: 'auto',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
  },
  documentSection: {
    width: '50%',
    alignItems: 'flex-end',
  },
  documentBox: {
    border: '2px solid #f59e0b',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fffbeb',
    minWidth: 180,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706',
    textAlign: 'center',
    marginBottom: 5,
  },
  documentNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b45309',
    textAlign: 'center',
    marginBottom: 8,
  },
  rucText: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
  },
  // Sección de cliente y venta
  infoSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 6,
    marginBottom: 8,
    borderLeft: '3px solid #f59e0b',
    paddingLeft: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#4b5563',
    width: 90,
    fontSize: 8,
  },
  infoValue: {
    color: '#1f2937',
    flex: 1,
    fontSize: 8,
  },
  // Tabla de productos
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#d97706',
    color: '#ffffff',
    padding: 8,
    fontSize: 8,
    fontWeight: 'bold',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 6,
    fontSize: 8,
    minHeight: 25,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  // Columnas de la tabla
  colItem: { width: '5%', textAlign: 'center' },
  colProducto: { width: '40%', paddingRight: 5 },
  colUnidad: { width: '12%', textAlign: 'center' },
  colCantidad: { width: '10%', textAlign: 'center' },
  colPrecio: { width: '13%', textAlign: 'right', paddingRight: 5 },
  colSubtotal: { width: '20%', textAlign: 'right', paddingRight: 5 },
  // Totales
  totalsContainer: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 220,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: '1px solid #e5e7eb',
  },
  totalLabel: {
    fontSize: 9,
    color: '#4b5563',
  },
  totalValue: {
    fontSize: 9,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#d97706',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Observaciones y footer
  observaciones: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderLeft: '3px solid #f59e0b',
    borderRadius: 4,
  },
  observacionesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  observacionesText: {
    fontSize: 8,
    color: '#78350f',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  footerBold: {
    fontWeight: 'bold',
    color: '#374151',
  },
})

export default function PDFVentaDocument({
  venta,
}: {
  venta: VentaConRelaciones
}) {
  // Calcular productos y totales
  const productos = venta.productos_por_almacen.flatMap((pa) =>
    pa.unidades_derivadas.map((ud) => ({
      nombre: pa.producto_almacen.producto.name,
      marca: pa.producto_almacen.producto.marca.name,
      unidad: ud.unidad_derivada_inmutable.name,
      cantidad: Number(ud.cantidad),
      precio: Number(ud.precio),
      subtotal: Number(ud.cantidad) * Number(ud.factor) * Number(ud.precio),
    }))
  )

  const subtotal = productos.reduce((sum, p) => sum + p.subtotal, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const clienteNombre =
    venta.cliente?.razon_social ||
    `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim() ||
    'CLIENTES VARIOS'

  // Determinar el título del documento
  const getTituloDocumento = () => {
    switch (venta.tipo_documento) {
      case 'Factura':
        return 'FACTURA ELECTRÓNICA'
      case 'Boleta':
        return 'BOLETA DE VENTA ELECTRÓNICA'
      case 'NotaDeVenta':
        return 'NOTA DE VENTA'
      default:
        return venta.tipo_documento.toUpperCase()
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header con Logo y Documento */}
        <View style={styles.headerContainer}>
          {/* Logo y datos de empresa */}
          <View style={styles.logoSection}>
            <Image
              src={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo-horizontal.png`}
              style={styles.logo}
            />
            <View style={styles.companyInfo}>
              <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 3 }}>
                EMPRESA DEMO S.A.C.
              </Text>
              <Text>RUC: 20123456789</Text>
              <Text>Av. Principal 123, Lima - Perú</Text>
              <Text>Teléfono: (01) 123-4567</Text>
              <Text>Email: ventas@empresa.com</Text>
            </View>
          </View>

          {/* Cuadro del documento */}
          <View style={styles.documentSection}>
            <View style={styles.documentBox}>
              <Text style={styles.rucText}>RUC: 20123456789</Text>
              <Text style={styles.documentTitle}>{getTituloDocumento()}</Text>
              <Text style={styles.documentNumber}>
                {venta.serie || 'S/N'}-{String(venta.numero || 0).padStart(8, '0')}
              </Text>
            </View>
          </View>
        </View>

        {/* Datos del Cliente */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{clienteNombre}</Text>
            </View>
            {venta.cliente?.numero_documento && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>
                  {venta.cliente.tipo_cliente === 'Empresa' ? 'RUC:' : 'DNI:'}
                </Text>
                <Text style={styles.infoValue}>{venta.cliente.numero_documento}</Text>
              </View>
            )}
            {venta.cliente?.direccion && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Dirección:</Text>
                <Text style={styles.infoValue}>{venta.cliente.direccion}</Text>
              </View>
            )}
            {venta.cliente?.telefono && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{venta.cliente.telefono}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Datos de la Venta */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DE LA VENTA</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fecha Emisión:</Text>
              <Text style={styles.infoValue}>
                {new Date(venta.fecha).toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Forma de Pago:</Text>
              <Text style={styles.infoValue}>{venta.forma_de_pago}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Moneda:</Text>
              <Text style={styles.infoValue}>Soles (PEN)</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Vendedor:</Text>
              <Text style={styles.infoValue}>{venta.user.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Almacén:</Text>
              <Text style={styles.infoValue}>{venta.almacen.name}</Text>
            </View>
          </View>
        </View>

        {/* Tabla de Productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>#</Text>
            <Text style={styles.colProducto}>DESCRIPCIÓN</Text>
            <Text style={styles.colUnidad}>UNIDAD</Text>
            <Text style={styles.colCantidad}>CANT.</Text>
            <Text style={styles.colPrecio}>P. UNIT.</Text>
            <Text style={styles.colSubtotal}>SUBTOTAL</Text>
          </View>

          {productos.map((producto, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colItem}>{idx + 1}</Text>
              <Text style={styles.colProducto}>
                {producto.nombre}
                {'\n'}
                <Text style={{ fontSize: 7, color: '#6b7280' }}>
                  Marca: {producto.marca}
                </Text>
              </Text>
              <Text style={styles.colUnidad}>{producto.unidad}</Text>
              <Text style={styles.colCantidad}>{producto.cantidad.toFixed(2)}</Text>
              <Text style={styles.colPrecio}>S/ {producto.precio.toFixed(2)}</Text>
              <Text style={styles.colSubtotal}>S/ {producto.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Op. Gravada:</Text>
              <Text style={styles.totalValue}>S/ {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGV (18%):</Text>
              <Text style={styles.totalValue}>S/ {igv.toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>IMPORTE TOTAL:</Text>
              <Text style={styles.grandTotalValue}>S/ {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        {venta.descripcion && (
          <View style={styles.observaciones}>
            <Text style={styles.observacionesTitle}>OBSERVACIONES:</Text>
            <Text style={styles.observacionesText}>{venta.descripcion}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBold}>¡Gracias por su preferencia!</Text>
          <Text>
            Este documento es una representación impresa de la {getTituloDocumento().toLowerCase()}
          </Text>
          <Text>Para consultas: ventas@empresa.com | Tel: (01) 123-4567</Text>
        </View>
      </Page>
    </Document>
  )
}
