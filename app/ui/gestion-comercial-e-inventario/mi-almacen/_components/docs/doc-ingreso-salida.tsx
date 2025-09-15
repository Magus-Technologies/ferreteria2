'use client'

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { Prisma } from '@prisma/client'
import { TiposDocumentos } from '~/lib/docs'
import { styles_globales } from '~/components/pdf/table-pdf-ag-grid'
import { useColumnsDocIngresoSalida } from '../tables/columns-doc-ingreso-salida'
import { getCellValue } from '~/utils/docs'

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    backgroundColor: 'rgb(69 85 108)',
    color: '#fff',
    padding: '4px 16px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  headerInformacionGeneral: {
    display: 'flex',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    backgroundColor: 'rgb(69 85 108)',
    color: '#fff',
    padding: '4px 16px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  sectionInformacionGeneral: {
    marginTop: 4,
    fontSize: 7,
    display: 'flex',
    gap: '8px',
    width: '100%',
  },
  sectionInformacionGeneralColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
    gap: '2px',
  },
  subSectionInformacionGeneral: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    width: '100%',
  },
  textTitleSubSectionInformacionGeneral: {
    width: '50%',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  textValueSubSectionInformacionGeneral: {
    width: '50%',
  },
})

export type DataDocIngresoSalida =
  | Prisma.IngresoSalidaGetPayload<{
      include: {
        user: true
        almacen: true
        proveedor: true
        tipo_ingreso: true
        productos_por_almacen: {
          include: {
            producto_almacen: {
              include: {
                producto: true
              }
            }
            unidades_derivadas: {
              include: {
                unidad_derivada_inmutable: true
              }
            }
          }
        }
      }
    }>
  | undefined

export default function DocIngresoSalida({
  data,
  nro_doc,
}: {
  data: DataDocIngresoSalida
  nro_doc: string
}) {
  const colDefs = useColumnsDocIngresoSalida()
  const rowData =
    data?.productos_por_almacen.flatMap(pa =>
      pa.unidades_derivadas.map(ud => ({
        ...ud,
        producto_almacen_ingreso_salida: {
          ...pa,
          producto_almacen: {
            ...pa.producto_almacen,
            producto: pa.producto_almacen.producto,
          },
        },
        unidad_derivada_inmutable: ud.unidad_derivada_inmutable,
      }))
    ) ?? []

  const tipo_documento = data?.tipo_documento
    ? TiposDocumentos[data.tipo_documento].name
    : ''

  return (
    <Document title={nro_doc}>
      <Page size='A4' style={styles_globales.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Documento de {tipo_documento}</Text>
          <Text>Nro: {nro_doc}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.headerInformacionGeneral}>
            Información General
          </Text>
          <View style={styles.sectionInformacionGeneral}>
            <View style={styles.sectionInformacionGeneralColumn}>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>
                  Fecha de Emisión:
                </Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>
                  {new Date(data?.created_at || '').toLocaleDateString(
                    'es-ES',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }
                  )}
                </Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>
                  Almacén:
                </Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>
                  {data?.almacen.name}
                </Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>
                  Usuario:
                </Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>
                  {data?.user.name}
                </Text>
              </View>
            </View>
            <View style={styles.sectionInformacionGeneralColumn}>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>
                  Proveedor:
                </Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>
                  {data?.proveedor?.razon_social ?? '-'}
                </Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>
                  Tipo de {tipo_documento}:
                </Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>
                  {data?.tipo_ingreso.name}
                </Text>
              </View>
              <View style={styles.subSectionInformacionGeneral}>
                <Text style={styles.textTitleSubSectionInformacionGeneral}>
                  Observaciones:
                </Text>
                <Text style={styles.textValueSubSectionInformacionGeneral}>
                  {data?.descripcion ?? '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles_globales.sectionTable}>
          <View style={styles_globales.tableHeader}>
            {colDefs.map((colDef, idx) => {
              return (
                <Text
                  key={idx}
                  style={{
                    ...styles_globales.cell,
                    flex: colDef.flex,
                    fontWeight: 'bold',
                  }}
                >
                  {colDef.headerName}
                </Text>
              )
            })}
          </View>

          {rowData.map((item, idx) => (
            <View
              key={idx}
              style={{
                ...styles_globales.tableRow,
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
              }}
            >
              {colDefs.map((colDef, idxCol) => {
                return (
                  <Text
                    key={`${idx}-${idxCol}`}
                    style={{
                      ...styles_globales.cell,
                      flex: colDef.flex,
                    }}
                  >
                    {getCellValue(colDef, item)}
                  </Text>
                )
              })}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
