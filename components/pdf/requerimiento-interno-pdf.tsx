import { Document, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer'
import type { RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import type { EmpresaPublica } from '~/hooks/use-empresa-publica'

const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerDatosEmpresa: {
    fontSize: 7,
    textAlign: 'center',
    maxWidth: 130,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerCompanyName: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  headerCompanyDetails: {
    fontSize: 7,
    color: '#666',
    marginBottom: 1,
  },
  headerDocument: {
    maxWidth: 280,
    fontSize: 10,
    display: 'flex',
    gap: 8,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 36px',
    borderRadius: '8px',
    border: '2px solid #fadc06',
    backgroundColor: '#fffbeb',
  },
  headerTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    padding: '6px 10px',
    textTransform: 'uppercase',
    backgroundColor: '#fadc06',
    fontSize: 11,
    borderRadius: '4px',
  },
  headerDocNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: '1px solid #fadc06',
  },
  sectionInformacionGeneral: {
    padding: '6px 10px',
    fontSize: 8,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    border: '1.5px solid #fadc06',
    borderRadius: '4px',
    backgroundColor: '#fffbeb',
  },
  sectionInformacionGeneralColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
    gap: '3px',
  },
  subSectionInformacionGeneral: {
    display: 'flex',
    flexDirection: 'row',
    gap: '6px',
    width: '100%',
  },
  textTitleSubSectionInformacionGeneral: {
    width: '40%',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 7.5,
  },
  textValueSubSectionInformacionGeneral: {
    width: '60%',
    fontSize: 8,
  },
  titleSectionInformacionGeneral: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: '1px solid #fadc06',
  },
  tableHeader: {
    fontSize: 8,
    display: 'flex',
    flexDirection: 'row',
    fontWeight: 'bold',
    backgroundColor: '#fadc06',
    color: '#000',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid #fadc06',
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 8,
    backgroundColor: '#fafafa',
  },
  tableRowAlt: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid #fadc06',
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 8,
    backgroundColor: '#fff',
  },
  tableCell: {
    padding: 3,
    fontSize: 8,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tableCellHeader: {
    padding: 3,
    fontSize: 8,
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  table: {
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: '#fadc06',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  observaciones: {
    fontSize: 8,
    textAlign: 'left',
    padding: '8px 10px',
    border: '1.5px solid #fadc06',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: '#fffbeb',
    minHeight: 40,
  },
  observacionesLabel: {
    fontWeight: 'bold',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 24,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  signatureBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '30%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    width: '100%',
    marginTop: 28,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  approvalsSection: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'row',
    borderTop: '2px solid #fadc06',
    paddingTop: 10,
    gap: 8,
  },
  approvalColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 7,
    textAlign: 'center',
    borderLeft: '1.5px solid #fadc06',
    paddingLeft: 8,
  },
  approvalColumnFirst: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 7,
    textAlign: 'center',
  },
  approvalLabel: {
    fontWeight: 'bold',
    marginBottom: 3,
    textTransform: 'uppercase',
    fontSize: 7.5,
  },
})

interface RequerimientoInternoPdfProps {
  requerimiento: RequerimientoInterno
  empresa?: EmpresaPublica | null
  responsableDni?: string
  responsableNombre?: string
  solicitanteDni?: string
  show_logo_html?: boolean
}

export default function RequerimientoInternoPdf({
  requerimiento,
  empresa,
  responsableDni = '',
  responsableNombre = '',
  solicitanteDni = '',
  show_logo_html = false,
}: RequerimientoInternoPdfProps) {
  const fecha = new Date(requerimiento.created_at)
  const fechaFormato = fecha.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document title={`${requerimiento.codigo}-LOG-F-03`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {show_logo_html ? (
            <img src="/logo-vertical.png" width={180} height={180} alt="Logo" />
          ) : (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image
              src="/logo-vertical.png"
              style={{ maxHeight: 180, maxWidth: 180 }}
            />
          )}
          <View style={styles.headerDatosEmpresa}>
            <Text style={styles.headerCompanyName}>{empresa?.razon_social || 'GRUPO MI REDENTOR S.A.C.'}</Text>
            <Text style={styles.headerCompanyDetails}>Dirección: {empresa?.direccion || 'Cal. Sinchi Roca Mza. 6 Lote 15 P.J. El Milagro'}</Text>
            <Text style={styles.headerCompanyDetails}>Teléfono: {empresa?.telefono || '999999'}</Text>
            <Text style={styles.headerCompanyDetails}>Email: {empresa?.email || 'info@gruporedentorsac.com'}</Text>
          </View>
          <View style={styles.headerDocument}>
            <Text style={styles.headerTitle}>REQUERIMIENTO INTERNO DE ÁREA</Text>
            <Text style={styles.headerDocNumber}>{requerimiento.codigo}</Text>
            <Text style={{ fontSize: 7, textAlign: 'center' }}>LOG-F-03</Text>
          </View>
        </View>

        {/* Información General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.sectionInformacionGeneral}>
            <View style={styles.sectionInformacionGeneralColumn}>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Número:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{requerimiento.codigo}</Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Fecha:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{fechaFormato}</Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Tipo:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>
                  {requerimiento.tipo_solicitud === 'OC' ? 'Orden de Compra' : 'Orden de Servicio'}
                </Text>
              </View>
            </View>
            <View style={styles.sectionInformacionGeneralColumn}>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Área:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{requerimiento.area}</Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Prioridad:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{requerimiento.prioridad}</Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Estado:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{requerimiento.estado}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Solicitante y Responsable */}
        <View style={styles.section}>
          <Text style={styles.titleSectionInformacionGeneral}>Solicitante y Responsable</Text>
          <View style={styles.sectionInformacionGeneral}>
            <View style={styles.sectionInformacionGeneralColumn}>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Solicitante:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{requerimiento.user?.name || '—'}</Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>DNI Solicitante:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{solicitanteDni || '—'}</Text>
              </View>
            </View>
            <View style={styles.sectionInformacionGeneralColumn}>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>Responsable:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{responsableNombre || '—'}</Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>DNI Responsable:</Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>{responsableDni || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabla de Productos/Servicios */}
        <View style={styles.section}>
          <Text style={styles.titleSectionInformacionGeneral}>
            {requerimiento.tipo_solicitud === 'OC' ? 'Productos Requeridos' : 'Servicios Requeridos'}
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableCellHeader, flex: 0.6 }}>CÓDIGO</Text>
              <Text style={{ ...styles.tableCellHeader, flex: 1.2 }}>CANTIDAD</Text>
              <Text style={{ ...styles.tableCellHeader, flex: 1 }}>U.M</Text>
              <Text style={{ ...styles.tableCellHeader, flex: 3 }}>DESCRIPCIÓN</Text>
            </View>

            {requerimiento.tipo_solicitud === 'OC' && requerimiento.productos && requerimiento.productos.length > 0 ? (
              requerimiento.productos.map((prod, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, flex: 0.6 }}>
                    {prod.producto?.cod_producto || '—'}
                  </Text>
                  <Text style={{ ...styles.tableCell, flex: 1.2 }}>
                    {prod.cantidad}
                  </Text>
                  <Text style={{ ...styles.tableCell, flex: 1 }}>
                    {prod.unidad || prod.producto?.unidad_medida?.name || 'UND'}
                  </Text>
                  <Text style={{ ...styles.tableCell, flex: 3 }}>
                    {prod.producto?.name || '—'}
                  </Text>
                </View>
              ))
            ) : requerimiento.tipo_solicitud === 'OS' && requerimiento.servicio ? (
              <View style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 0.6 }}>—</Text>
                <Text style={{ ...styles.tableCell, flex: 1.2 }}>1</Text>
                <Text style={{ ...styles.tableCell, flex: 1 }}>SRV</Text>
                <Text style={{ ...styles.tableCell, flex: 3 }}>
                  {requerimiento.servicio.tipo_servicio}: {requerimiento.servicio.descripcion_servicio}
                </Text>
              </View>
            ) : (
              <View style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 10 }}>Sin items registrados</Text>
              </View>
            )}
          </View>
        </View>

        {/* Observaciones */}
        <View style={styles.section}>
          <View style={styles.observaciones}>
            <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
            <Text>{requerimiento.observaciones || '—'}</Text>
          </View>
        </View>

        {/* Proveedor Sugerido */}
        {requerimiento.proveedor_sugerido && (
          <View style={styles.section}>
            <Text style={styles.titleSectionInformacionGeneral}>Proveedor Sugerido</Text>
            <View style={styles.sectionInformacionGeneral}>
              <View style={styles.sectionInformacionGeneralColumn}>
                <View style={styles.subSectionInformacionGeneral}>
                  <Text style={styles.textTitleSubSectionInformacionGeneral}>Razón Social:</Text>
                  <Text style={styles.textValueSubSectionInformacionGeneral}>
                    {requerimiento.proveedor_sugerido.razon_social}
                  </Text>
                </View>
              </View>
              <View style={styles.sectionInformacionGeneralColumn}>
                <View style={styles.subSectionInformacionGeneral}>
                  <Text style={styles.textTitleSubSectionInformacionGeneral}>RUC:</Text>
                  <Text style={styles.textValueSubSectionInformacionGeneral}>
                    {requerimiento.proveedor_sugerido.ruc}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Footer - Firmas */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Responsable del Área</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Solicitante</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Supervisor</Text>
          </View>
        </View>

        {/* Aprobaciones */}
        <View style={styles.approvalsSection}>
          <View style={styles.approvalColumnFirst}>
            <Text style={styles.approvalLabel}>Elaborador Por:</Text>
            <Text>Área de Compras</Text>
          </View>
          <View style={styles.approvalColumn}>
            <Text style={styles.approvalLabel}>Revisado Por:</Text>
            <Text>Departamento de Logística y Operaciones</Text>
          </View>
          <View style={styles.approvalColumn}>
            <Text style={styles.approvalLabel}>Aprobado por:</Text>
            <Text>Gerencia General</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
