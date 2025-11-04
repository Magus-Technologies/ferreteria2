import { Document, Page, Text, View } from '@react-pdf/renderer'
import { styles_ticket } from './styles'
import { Empresa } from '@prisma/client'
import { ColDef } from 'ag-grid-community'
import DocHeaderTicket from './doc-header-ticket'
import DocTableTicket from './doc-table-ticket'
import { NumeroALetras } from '~/utils/numero-a-letras'

export default function DocGeneralTicket<T>({
  empresa,
  show_logo_html = false,
  tipo_documento,
  nro_doc,
  children,
  colDefs,
  rowData,
  total,
  observaciones,
  headerNameAl100,
  totalConLetras = false,
}: {
  empresa: Empresa | undefined
  show_logo_html?: boolean
  tipo_documento: string
  nro_doc: string
  children: React.ReactNode

  colDefs: ColDef[]
  rowData: T[]
  total: number
  observaciones: string
  headerNameAl100: string
  totalConLetras?: boolean
}) {
  return (
    <Document title={nro_doc}>
      <Page
        size={{ width: 80 / 0.3528, height: 400 / 0.3528 }}
        style={styles_ticket.page}
      >
        <DocHeaderTicket
          empresa={empresa}
          show_logo_html={show_logo_html}
          tipo_documento={tipo_documento}
          nro_doc={nro_doc}
        />
        {children}
        <DocTableTicket
          colDefs={colDefs}
          rowData={rowData}
          headerNameAl100={headerNameAl100}
        />
        <View
          style={{
            marginBottom: 6,
          }}
        >
          <View style={styles_ticket.total}>
            <Text style={styles_ticket.textTotal}>TOTAL</Text>
            <Text>{total}</Text>
          </View>
          {totalConLetras && (
            <Text style={{ fontSize: 7 }}>{NumeroALetras(total)}</Text>
          )}
        </View>
        <View style={styles_ticket.observaciones}>
          <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
          <Text>{observaciones}</Text>
        </View>
      </Page>
    </Document>
  )
}
