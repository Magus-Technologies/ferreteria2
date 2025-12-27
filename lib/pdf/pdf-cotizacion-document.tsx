import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { CotizacionConRelaciones } from "./generar-pdf-cotizacion";

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
    fontSize: 8,
    color: "#000",
    lineHeight: 1.6,
    paddingTop: 0,
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  documentSection: {
    width: "45%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  documentBox: {
    border: "0.5px solid #000",
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
    border: "0.5px solid #000",
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
    border: "1px solid #000",
  },
  tableHeader: {
    flexDirection: "row",
    padding: 4,
    fontSize: 7,
    fontWeight: "bold",
    borderBottom: "1px solid #000",
    backgroundColor: "#f0f0f0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    minHeight: 20,
  },
  tableCell: {
    padding: 3,
    fontSize: 7,
    borderRight: "1px solid #000",
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
    // borderBottom: "1px solid #000",
  },
  bottomRow: {
    flexDirection: "row",
    minHeight: 120,
    // borderLeft: "1px solid #000
    // borderRight: "1px solid #000",
    // borderBottom: "1px solid #000",
  },
  observacionesCell: {
    width: "65%",
    padding: 15,
    borderRight: "1px solid #fff",
    justifyContent: "center",
  },
  observacionesBox: {
    border: "1.5px solid #000",
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
    borderBottom: "1px solid #000",
  },
  totalRowLast: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
  },
  totalLabelCell: {
    width: "60%",
    borderRight: "1px solid #000",
    borderLeft: "1px solid #000",
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
    borderRight: "1px solid #000",
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
  canjearText: {
    textAlign: "center",
    fontSize: 7,
    marginBottom: 15,
  },
  cuentasTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 5,
    marginTop: 10,
    width: "55%",
  },
  cuentasTableContainer: {
    alignItems: "flex-end",
  },
  cuentasTable: {
    border: "1px solid #000",
    width: "55%",
  },
  cuentasHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    fontWeight: "bold",
  },
  cuentasRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
  },
  cuentasCell: {
    padding: 2,
    fontSize: 5,
    borderRight: "1px solid #000",
    textAlign: "center",
  },
  cuentasColEntidad: { width: "25%" },
  cuentasColCuenta: { width: "25%" },
  cuentasColNumero: { width: "25%" },
  cuentasColCCI: { width: "25%", borderRight: "none" },
});

export default function PDFCotizacionDocument({
  cotizacion,
}: {
  cotizacion: CotizacionConRelaciones;
}) {
  // Soportar tanto snake_case (Prisma) como camelCase (Laravel)
  const productosPorAlmacen = cotizacion.productosPorAlmacen || cotizacion.productos_por_almacen || [];

  const productos = productosPorAlmacen.flatMap((pa: any) => {
    const unidadesDerivadas = pa.unidadesDerivadas || pa.unidades_derivadas || [];
    const productoAlmacen = pa.productoAlmacen || pa.producto_almacen;

    return unidadesDerivadas.map((ud: any) => {
      const unidadDerivadaInmutable = ud.unidadDerivadaInmutable || ud.unidad_derivada_inmutable;

      return {
        codigo: productoAlmacen?.producto?.cod_producto || productoAlmacen?.producto?.codigo || "",
        nombre: productoAlmacen?.producto?.name || productoAlmacen?.producto?.descripcion || "",
        marca: productoAlmacen?.producto?.marca?.name || "N/A",
        unidad: unidadDerivadaInmutable?.name || "UND",
        cantidad: Number(ud.cantidad || 0),
        precio: Number(ud.precio || 0),
        descuento: Number(ud.descuento || 0),
        subtotal: Number(ud.cantidad || 0) * Number(ud.factor || 1) * Number(ud.precio || 0),
      };
    });
  });

  const subtotal = productos.reduce((sum: number, p: any) => sum + p.subtotal, 0);
  const totalDescuento = productos.reduce((sum: number, p: any) => sum + p.descuento, 0);
  const total = subtotal - totalDescuento;

  const clienteNombre =
    cotizacion.cliente?.razon_social ||
    `${cotizacion.cliente?.nombres || ""} ${
      cotizacion.cliente?.apellidos || ""
    }`.trim() ||
    "CLIENTE GENERAL";

  const fechaEmision = new Date(cotizacion.fecha);
  const fechaVencimiento = new Date(cotizacion.fecha_vencimiento);

  const formatFecha = (fecha: Date) => {
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = String(fecha.getFullYear()).slice(-2);
    return `${dia}/${mes}/${anio}`;
  };

  const formatHora = (fecha: Date) => {
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${horas}:${minutos}:00`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            <Image
              src={`${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/logoPdf.png`}
              style={styles.logo}
            />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>GRUPO MI REDENTOR S.A.C</Text>
              <Text>CAL.SINCHI ROCA MZA. 6 LOTE. 15 P.J.</Text>
              <Text>EL MILAGRO (SECTOR III)</Text>
              <Text>{"\n"}Cel: 908846540 / 952686345</Text>
              <Text>{"\n"}Email: grupomiredentorsac@gmail.com</Text>
            </View>
          </View>

          <View style={styles.documentSection}>
            <View style={styles.documentBox}>
              <Text style={styles.rucText}>R.U.C 20611539160</Text>
              <Text style={styles.documentTitle}>Proforma</Text>
              <Text style={styles.documentNumber}>{cotizacion.numero}</Text>
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
              : {cotizacion.cliente?.direccion || ""}
            </Text>
            <Text style={styles.clienteCellRight}>Hora</Text>
            <Text style={styles.clienteCellValueRight}>
              : {formatHora(fechaEmision)}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>RUC / DNI</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {cotizacion.cliente?.numero_documento || ""}
            </Text>
            <Text style={styles.clienteCellRight}>F. Vencimiento</Text>
            <Text style={styles.clienteCellValueRight}>
              : {formatFecha(fechaVencimiento)}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Vendedor</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {cotizacion.user.name}
            </Text>
            <Text style={styles.clienteCellRight}>N° Guía</Text>
            <Text style={styles.clienteCellValueRight}>:</Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Forma Pago</Text>
            <Text style={styles.clienteCellValueLeft}>: CREDITO 7 DIAS</Text>
            <Text style={styles.clienteCellRight}>Moneda</Text>
            <Text style={styles.clienteCellValueRight}>
              : {cotizacion.tipo_moneda === "Soles" ? "SOL" : "USD"}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Cajero</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {cotizacion.user.name}
            </Text>
            <Text style={styles.clienteCellRight}>Orden de Compra</Text>
            <Text style={styles.clienteCellValueRight}>:</Text>
          </View>
        </View>

        <Text style={styles.introText}>
          De nuestra consideración: Por medio de la presente es grato saludarlos
          y a la vez cotizarle los siguientes productos:
        </Text>

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
                borderBottom: "1px solid #000",
              }}
            />
          )}

          <View style={styles.sonRow}>
            <Text>SON: SETECIENTOS CUARENTA Y SIETE CON 80/100 SOLES.</Text>
          </View>
        </View>

        {/* Sección de observaciones y totales FUERA de tableContainer */}
        <View style={styles.bottomRow}>
          <View style={styles.observacionesCell}>
            <View style={styles.observacionesBox}>
              <Text style={styles.observacionesTitle}>OBSERVACIONES</Text>
              <Text style={styles.observacionesList}>
                - LA MERCADERIA VIAJA POR CUENTA Y RIESGO DEL CLIENTE.{"\n"}-
                UNA VEZ RECIBIDA LA MERCADERIA NO HAY LUGAR A RECLAMO.{"\n"}-
                REPARTO MINIMO 1 DIA DE ANTICIPACION.{"\n"}- CAMBIO Y/O
                DEVOLUCION SERA EN UN PLAZO 5 DIAS CALENDARIO.{"\n"}- NO SE
                ACEPTAN CAMBIOS NI DEVOLUCIONES CON DAÑOS FISICOS O ACCESORIOS
                FALTANTES, SOLO POR FALLAS DE FABRICACION.
              </Text>
            </View>
          </View>

          <View style={styles.totalesCell}>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>SUBTOTAL</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>{subtotal.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>T. DESCUENTO</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>
                  {totalDescuento.toFixed(2)}
                </Text>
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
          Sin otro particular, esperando su pronta respuesta.{" "}
          <Text style={styles.footerBold}>
            ¡GRACIAS POR SU PREFERENCIA! ¡DIOS LES BENDIGA!
          </Text>
        </Text>
        <Text style={styles.canjearText}>- CANJEAR POR BOLETA O FACTURA -</Text>

        <View style={styles.cuentasTableContainer}>
          <Text style={styles.cuentasTitle}>CUENTAS:</Text>
          <View style={styles.cuentasTable}>
            <View style={styles.cuentasHeader}>
              <Text style={[styles.cuentasCell, styles.cuentasColEntidad]}>
                ENTIDAD
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCuenta]}>
                CUENTA
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColNumero]}>
                NUMERO
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCCI]}>
                CCI
              </Text>
            </View>
            <View style={styles.cuentasRow}>
              <Text style={[styles.cuentasCell, styles.cuentasColEntidad]}>
                BCP
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCuenta]}>
                AHORROS
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColNumero]}>
                57099829303065
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCCI]}>
                00257000998279306504
              </Text>
            </View>
            <View style={styles.cuentasRow}>
              <Text style={[styles.cuentasCell, styles.cuentasColEntidad]}>
                BBVA
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCuenta]}>
                AHORROS
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColNumero]}>
                57099829303065
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCCI]}>
                00257000998279306504
              </Text>
            </View>
            <View style={styles.cuentasRow}>
              <Text style={[styles.cuentasCell, styles.cuentasColEntidad]}>
                SCOTIABANK
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCuenta]}>
                AHORROS
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColNumero]}>
                7117529613
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCCI]}>
                00940830711752961369
              </Text>
            </View>
            <View style={[styles.cuentasRow, { borderBottom: "none" }]}>
              <Text style={[styles.cuentasCell, styles.cuentasColEntidad]}>
                INTERBANK
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCuenta]}>
                AHORROS
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColNumero]}>
                6003004488177
              </Text>
              <Text style={[styles.cuentasCell, styles.cuentasColCCI]}>
                00360000600344881774
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
