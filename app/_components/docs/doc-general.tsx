import { Document, Page, Text, View } from '@react-pdf/renderer'
import { styles_globales } from '~/components/pdf/table-pdf-ag-grid'
import DocHeader from './doc-header'
import { styles_docs } from './styles'
import DocTable from './doc-table'
import { ColDef } from 'ag-grid-community'
import { NumeroALetras } from '~/utils/numero-a-letras'
import { EmpresaSession } from '~/auth/auth'

export default function DocGeneral<T>({
  empresa,
  show_logo_html = false,
  tipo_documento,
  nro_doc,
  children,
  colDefs,
  rowData,
  total,
  observaciones,
  totalConLetras = false,
}: {
  empresa: EmpresaSession | undefined
  show_logo_html?: boolean
  tipo_documento: string
  nro_doc: string
  children: React.ReactNode

  colDefs: ColDef[]
  rowData: T[]
  total: number
  observaciones: string
  totalConLetras?: boolean
}) {
  return (
    <Document title={nro_doc}>
      <Page size='A4' style={styles_globales.page}>
        <DocHeader
          empresa={empresa}
          show_logo_html={show_logo_html}
          tipo_documento={tipo_documento}
          nro_doc={nro_doc}
        />

        {children}

        <DocTable colDefs={colDefs} rowData={rowData} />

        <View style={styles_docs.section}>
          <View style={styles_docs.total}>
            {totalConLetras && (
              <Text
                style={{ textAlign: 'left', position: 'absolute', left: 6 }}
              >
                {NumeroALetras(total)}
              </Text>
            )}
            <Text style={styles_docs.textTotal}>TOTAL</Text>
            <Text>{Number(total).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles_docs.observaciones}>
          <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
          <Text>{observaciones}</Text>
        </View>
      </Page>
    </Document>
  )
}
