'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'
import { ProductoCotizacionPDF, CotizacionDataPDF } from './doc-cotizacion'

// ============= COMPONENT =============

export default function DocCotizacionTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: CotizacionDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
}) {
  if (!data) return null

  // Definir columnas para la tabla de productos (formato ticket)
  const colDefs: ColDef<ProductoCotizacionPDF>[] = [
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
      headerName: 'P.U.',
      field: 'precio_unitario',
      width: 35,
      minWidth: 35,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(2) : '0.00'
      },
    },
    {
      headerName: 'Subt.',
      field: 'subtotal',
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

  // Nombre del cliente
  const nombreCliente = data.cliente.razon_social ||
    `${data.cliente.nombres || ''} ${data.cliente.apellidos || ''}`.trim()

  return (
    <DocGeneralTicket
      empresa={empresaConLogo as any}
      show_logo_html={show_logo_html}
      tipo_documento="PROFORMA"
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={data.productos}
      total={data.total}
      observaciones={data.observaciones || '-'}
      headerNameAl100='Descripción'
      totalConLetras
    >
      {/* Información del Cliente y Cotización */}
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            {/* Fecha de Emisión */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Fecha de Emisión:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {new Date(data.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Fecha de Vencimiento */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                F. Vencimiento:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {new Date(data.fecha_vencimiento).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* RUC/DNI del Cliente */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                {data.cliente.numero_documento.length === 11 ? 'RUC:' : 'DNI:'}
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data.cliente.numero_documento}
              </Text>
            </View>

            {/* Cliente */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Cliente:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {nombreCliente}
              </Text>
            </View>

            {/* Dirección del Cliente */}
            {data.cliente.direccion && (
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
                  {data.cliente.direccion}
                </Text>
              </View>
            )}

            {/* Vendedor */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Vendedor:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data.vendedor}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Totales: Subtotal, Descuento, Total */}
      <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottom: '1px solid #ccc' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>SUBTOTAL:</Text>
          <Text style={{ fontSize: 8 }}>S/ {data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottom: '1px solid #ccc' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>T. DESCUENTO:</Text>
          <Text style={{ fontSize: 8 }}>S/ {data.total_descuento.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, backgroundColor: '#f0f0f0', paddingHorizontal: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>TOTAL:</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>S/ {data.total.toFixed(2)}</Text>
        </View>
      </View>
    </DocGeneralTicket>
  )
}
