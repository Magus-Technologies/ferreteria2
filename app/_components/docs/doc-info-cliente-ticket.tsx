import { Text, View } from '@react-pdf/renderer'
import { styles_ticket } from './styles'

interface DocInfoClienteTicketProps {
  cliente: {
    numero_documento: string
    razon_social?: string
    nombres?: string
    apellidos?: string
    direccion?: string
    telefono?: string
  }
  getEstiloCampo?: (campo: string) => { 
    fontFamily?: string
    fontSize?: number
    fontWeight?: string 
  }
}

export default function DocInfoClienteTicket({
  cliente,
  getEstiloCampo = () => ({ fontSize: 7 }),
}: DocInfoClienteTicketProps) {
  // Nombre del cliente
  const nombreCliente = cliente.razon_social ||
    `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()

  return (
    <View style={{
      ...styles_ticket.sectionInformacionGeneral,
      borderTop: '1px dashed #000000',
      paddingTop: 6,
    }}>
      <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
        {/* Cliente */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
          <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Cliente:
          </Text>
          <Text style={getEstiloCampo('cliente_nombre')}>
            {nombreCliente}
          </Text>
        </View>

        {/* RUC/DNI del Cliente */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
          <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            {cliente.numero_documento.length === 11 ? 'RUC:' : 'DNI:'}
          </Text>
          <Text style={getEstiloCampo('cliente_documento')}>
            {cliente.numero_documento}
          </Text>
        </View>

        {/* Teléfono del Cliente */}
        {cliente.telefono && (
          <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
            <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
              Celular:
            </Text>
            <Text style={getEstiloCampo('cliente_telefono')}>
              {cliente.telefono}
            </Text>
          </View>
        )}

        {/* Dirección del Cliente */}
        {cliente.direccion && (
          <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
            <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
              Dirección:
            </Text>
            <Text style={getEstiloCampo('cliente_direccion')}>
              {cliente.direccion}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
