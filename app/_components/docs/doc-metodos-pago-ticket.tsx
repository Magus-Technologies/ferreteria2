import { Text, View } from '@react-pdf/renderer'
import { styles_ticket } from './styles'

interface DocMetodosPagoTicketProps {
  metodos_de_pago: Array<{
    forma_de_pago: string
    monto: number
  }>
  getEstiloCampo?: (campo: string) => { 
    fontFamily?: string
    fontSize?: number
    fontWeight?: string 
  }
}

export default function DocMetodosPagoTicket({
  metodos_de_pago,
  getEstiloCampo = () => ({ fontSize: 7 }),
}: DocMetodosPagoTicketProps) {
  if (!metodos_de_pago || metodos_de_pago.length === 0) return null

  return (
    <View style={{
      ...styles_ticket.sectionInformacionGeneral,
      borderTop: '1px dashed #000000',
      paddingTop: 6,
    }}>
      <View style={styles_ticket.sectionInformacionGeneralColumn}>
        {/* Métodos de Pago */}
        <View style={styles_ticket.subSectionInformacionGeneral}>
          <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
            Métodos de Pago:
          </Text>
          <View style={styles_ticket.textValueSubSectionInformacionGeneral}>
            {metodos_de_pago.map((mp, index) => (
              <Text
                key={index}
                style={getEstiloCampo('metodo_pago')}
              >
                {mp.forma_de_pago}: S/ {mp.monto.toFixed(2)}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}
