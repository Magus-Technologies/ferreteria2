'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'
import { ProductoPrestamoPDF, PrestamoDataPDF } from './doc-prestamo'

// ============= COMPONENT =============

export default function DocPrestamoTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: PrestamoDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
}) {
  if (!data) return null

  // Definir columnas para la tabla de productos (formato ticket)
  const colDefs: ColDef<ProductoPrestamoPDF>[] = [
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 30,
      minWidth: 30,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(0) : '0'
      },
    },
    {
      headerName: 'Descripción',
      field: 'descripcion',
      flex: 1,
      minWidth: 80,
    },
    {
      headerName: 'Costo',
      field: 'costo',
      width: 35,
      minWidth: 35,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(2) : '0.00'
      },
    },
    {
      headerName: 'Import.',
      field: 'importe',
      width: 40,
      minWidth: 40,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(2) : '0.00'
      },
    },
  ]

  // Preparar empresa con logo URL
  const empresaConLogo = empresa ? {
    ...empresa,
    logo: getLogoUrl(empresa.logo),
  } : undefined

  // Nombre de la entidad (cliente o proveedor)
  const nombreEntidad = data.entidad.razon_social ||
    `${data.entidad.nombres || ''} ${data.entidad.apellidos || ''}`.trim()

  return (
    <DocGeneralTicket
      empresa={empresaConLogo as any}
      show_logo_html={show_logo_html}
      tipo_documento={`${data.tipo_operacion.toUpperCase()} - PRÉSTAMO`}
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={data.productos}
      total={data.monto_total}
      observaciones={data.observaciones || '-'}
      headerNameAl100='Descripción'
      totalConLetras
    >
      {/* Información de la Entidad y Préstamo */}
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            {/* Fecha */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Fecha:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {new Date(data.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Tipo */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Operación:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data.tipo_operacion}
              </Text>
            </View>

            {/* RUC/DNI */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                {data.entidad.numero_documento.length === 11 ? 'RUC:' : 'DNI:'}
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data.entidad.numero_documento}
              </Text>
            </View>

            {/* Entidad */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                {data.tipo_entidad}:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {nombreEntidad}
              </Text>
            </View>

            {/* Dirección */}
            {data.entidad.direccion && (
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                  Dirección:
                </Text>
                <Text
                  style={{
                    ...styles_ticket.textValueSubSectionInformacionGeneral,
                    fontSize: 7,
                  }}
                >
                  {data.entidad.direccion}
                </Text>
              </View>
            )}

            {/* Usuario */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Usuario:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data.usuario}
              </Text>
            </View>

            {/* Garantía */}
            {data.garantia && (
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                  Garantía:
                </Text>
                <Text
                  style={{
                    ...styles_ticket.textValueSubSectionInformacionGeneral,
                    fontSize: 7,
                  }}
                >
                  {data.garantia}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </DocGeneralTicket>
  )
}
