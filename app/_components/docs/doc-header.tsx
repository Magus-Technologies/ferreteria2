import { Image, Text, View } from '@react-pdf/renderer'
import { styles_docs } from './styles'
import { EmpresaSession } from '~/auth/auth'

export default function DocHeader({
  empresa,
  show_logo_html = false,
  tipo_documento,
  nro_doc,
}: {
  empresa: EmpresaSession | undefined
  show_logo_html?: boolean
  tipo_documento: string
  nro_doc: string
}) {
  return (
    <View style={styles_docs.header}>
      {show_logo_html ? (
        <img src='/logo-vertical.png' width={180} height={180} alt='Logo' />
      ) : (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          src='/logo-vertical.png'
          style={{ maxHeight: 180, maxWidth: 180 }}
        />
      )}
      <View style={styles_docs.headerDatosEmpresa}>
        <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 6 }}>
          {empresa?.razon_social}
        </Text>
        <Text>{empresa?.direccion}</Text>
        <Text>
          <Text style={{ fontWeight: 'bold' }}>Cel: </Text>
          {empresa?.telefono}
        </Text>
        <Text style={{ marginTop: 6 }}>
          <Text style={{ fontWeight: 'bold' }}>Email: </Text>
          {empresa?.email}
        </Text>
      </View>
      <View style={styles_docs.headerDocument}>
        <Text style={{ fontWeight: 'bold' }}>R.U.C. {empresa?.ruc}</Text>
        <Text style={styles_docs.headerTitle}>
          Documento de {tipo_documento} 
        </Text>
        <Text>{nro_doc}</Text>
      </View>
    </View>
  )
}
