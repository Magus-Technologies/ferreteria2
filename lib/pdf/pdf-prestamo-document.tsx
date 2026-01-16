import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Prestamo } from "../api/prestamo";

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
    color: "#fadc06",
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
    border: "1px solid #fadc06",
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
    border: "1.5px solid #fadc06",
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
    border: "1px solid #fadc06",
    width: "55%",
  },
  cuentasHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #fadc06",
    fontWeight: "bold",
  },
  cuentasRow: {
    flexDirection: "row",
    borderBottom: "1px solid #fadc06",
  },
  cuentasCell: {
    padding: 2,
    fontSize: 5,
    borderRight: "1px solid #fadc06",
    textAlign: "center",
  },
  cuentasColEntidad: { width: "25%" },
  cuentasColCuenta: { width: "25%" },
  cuentasColNumero: { width: "25%" },
  cuentasColCCI: { width: "25%", borderRight: "none" },
});

export default function PDFPrestamoDocument({
  prestamo,
  logoDataURI,
}: {
  prestamo: Prestamo;
  logoDataURI: string;
}) {
  // Obtener datos de la empresa desde el usuario
  const empresa = (prestamo.user as any)?.empresa;

  // Procesar productos del préstamo
  const productos = prestamo.productosPorAlmacen?.flatMap((pa) =>
    pa.unidadesDerivadas?.map((ud) => ({
      codigo: pa.productoAlmacen?.producto?.cod_producto || "",
      nombre: pa.productoAlmacen?.producto?.name || "",
      marca: pa.productoAlmacen?.producto?.marca?.name || "N/A",
      unidad: ud.name,
      cantidad: Number(ud.cantidad),
      costo: Number(pa.costo),
      subtotal: Number(ud.cantidad) * Number(ud.factor) * Number(pa.costo),
    })) || []
  ) || [];

  const subtotal = productos.reduce((sum: number, p: any) => sum + p.subtotal, 0);
  const total = Number(prestamo.monto_total) || subtotal;

  // Nombre del cliente o proveedor
  const entidadNombre =
    prestamo.cliente?.razon_social ||
    `${prestamo.cliente?.nombres || ""} ${prestamo.cliente?.apellidos || ""}`.trim() ||
    prestamo.proveedor?.razon_social ||
    "ENTIDAD GENERAL";

  const fechaEmision = new Date(prestamo.fecha);
  const fechaVencimiento = new Date(prestamo.fecha_vencimiento);

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

  // Tipo de operación para el título
  const tipoOperacion = prestamo.tipo_operacion === 'PRESTAR' ? 'PRÉSTAMO' : 'PRÉSTAMO RECIBIDO';

  // Moneda
  const monedaSymbol = prestamo.tipo_moneda === 'd' ? '$' : 'S/.';
  const monedaNombre = prestamo.tipo_moneda === 'd' ? 'USD' : 'SOL';

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
              <Text style={styles.documentTitle}>{tipoOperacion}</Text>
              <Text style={styles.documentNumber}>{prestamo.numero}</Text>
            </View>
          </View>
        </View>

        <View style={styles.clienteBox}>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>
              {prestamo.tipo_entidad === 'CLIENTE' ? 'Cliente' : 'Proveedor'}
            </Text>
            <Text style={styles.clienteCellValueLeft}>: {entidadNombre}</Text>
            <Text style={styles.clienteCellRight}>F. Emisión</Text>
            <Text style={styles.clienteCellValueRight}>
              : {formatFecha(fechaEmision)}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Dirección</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {prestamo.direccion || prestamo.cliente?.direccion || prestamo.proveedor?.direccion || ""}
            </Text>
            <Text style={styles.clienteCellRight}>Hora</Text>
            <Text style={styles.clienteCellValueRight}>
              : {formatHora(fechaEmision)}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>RUC / DNI</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {prestamo.ruc_dni || prestamo.cliente?.numero_documento || prestamo.proveedor?.numero_documento || ""}
            </Text>
            <Text style={styles.clienteCellRight}>F. Vencimiento</Text>
            <Text style={styles.clienteCellValueRight}>
              : {formatFecha(fechaVencimiento)}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Vendedor</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {prestamo.vendedor || prestamo.user?.name || ""}
            </Text>
            <Text style={styles.clienteCellRight}>Estado</Text>
            <Text style={styles.clienteCellValueRight}>
              : {prestamo.estado_prestamo.toUpperCase()}
            </Text>
          </View>

          <View style={styles.clienteRow}>
            <Text style={styles.clienteCellLeft}>Teléfono</Text>
            <Text style={styles.clienteCellValueLeft}>
              : {prestamo.telefono || prestamo.cliente?.telefono || prestamo.proveedor?.telefono || ""}
            </Text>
            <Text style={styles.clienteCellRight}>Moneda</Text>
            <Text style={styles.clienteCellValueRight}>
              : {monedaNombre}
            </Text>
          </View>

          {prestamo.tasa_interes && (
            <View style={styles.clienteRow}>
              <Text style={styles.clienteCellLeft}>Tasa Interés</Text>
              <Text style={styles.clienteCellValueLeft}>
                : {prestamo.tasa_interes}% {prestamo.tipo_interes || ''}
              </Text>
              <Text style={styles.clienteCellRight}>Días Gracia</Text>
              <Text style={styles.clienteCellValueRight}>
                : {prestamo.dias_gracia || 0} días
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.introText}>
          De nuestra consideración: Por medio de la presente se detalla el siguiente {tipoOperacion.toLowerCase()}:
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
            <Text style={[styles.tableCell, styles.colPrecio]}>COSTO UNI.</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>-</Text>
            <Text style={[styles.tableCell, styles.colImporte]}>IMPORTE</Text>
          </View>

          {productos.map((producto, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colItem]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, styles.colUbi]}>
                {prestamo.almacen?.name || 'A1'}
              </Text>
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
                {producto.costo.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.colDesc]}>
                -
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
            <Text>TOTAL DEL {tipoOperacion.toUpperCase()}</Text>
          </View>
        </View>

        {/* Sección de observaciones y totales */}
        <View style={styles.bottomRow}>
          <View style={styles.observacionesCell}>
            <View style={styles.observacionesBox}>
              <Text style={styles.observacionesTitle}>OBSERVACIONES</Text>
              <Text style={styles.observacionesList}>
                {prestamo.observaciones || "- NO HAY OBSERVACIONES ADICIONALES"}
              </Text>
              {prestamo.garantia && (
                <Text style={styles.observacionesList}>
                  {"\n"}GARANTÍA: {prestamo.garantia}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.totalesCell}>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>MONTO TOTAL</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>
                  {monedaSymbol} {total.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>MONTO PAGADO</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>
                  {monedaSymbol} {Number(prestamo.monto_pagado || 0).toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.totalRowLast}>
              <View style={styles.totalLabelCell}>
                <Text style={styles.totalLabelText}>SALDO PENDIENTE</Text>
              </View>
              <View style={styles.totalValueCell}>
                <Text style={styles.totalValueText}>
                  {monedaSymbol} {Number(prestamo.monto_pendiente || 0).toFixed(2)}
                </Text>
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

        <View style={styles.cuentasTableContainer}>
          <Text style={styles.cuentasTitle}>CUENTAS PARA PAGOS:</Text>
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
