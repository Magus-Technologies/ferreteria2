import { Text, View } from '@react-pdf/renderer'
import { getCellValue } from '~/utils/docs'
import { ColDef } from 'ag-grid-community'
import { styles_ticket } from './styles'

export default function DocTableTicket<T>({
  colDefs,
  rowData,
  headerNameAl100,
  getEstiloCampo,
}: {
  colDefs: ColDef[]
  rowData: T[]
  headerNameAl100: string
  getEstiloCampo?: (campo: string) => { fontFamily?: string; fontSize?: number; fontWeight?: string }
}) {
  const colDefHederNameAl100 = colDefs.find(
    colDef => colDef.headerName === headerNameAl100
  )
  
  // Función helper para obtener estilos de un campo
  const getFieldStyle = (headerName: string) => {
    if (!getEstiloCampo) return {}
    
    // Mapear nombres de columnas a campos de configuración
    const fieldMap: Record<string, string> = {
      // Campos de ingreso/salida
      'Código': 'tabla_codigo',
      'Cantidad': 'tabla_cantidad',
      'Unidad Derivada': 'tabla_unidad',
      'Costo': 'tabla_costo',
      // Campos de venta
      'Cant.': 'tabla_cantidad',
      'Descripción': 'tabla_descripcion',
      'P.U.': 'tabla_precio',
      'Subt.': 'tabla_subtotal',
      // Campos de cotización y unidades
      'Unid.': 'tabla_unidad',
      'P. Unit.': 'tabla_precio',
      'Desc.': 'tabla_descuento',
      'Subtotal': 'tabla_subtotal',
    }
    
    const campo = fieldMap[headerName]
    return campo ? getEstiloCampo(campo) : {}
  }
  
  return (
    <View style={styles_ticket.sectionTable}>
      <Text
        style={{
          ...styles_ticket.cell,
          fontSize: 7,
          fontWeight: 'bold',
          paddingBottom: 0,
        }}
      >
        {colDefHederNameAl100?.headerName}
      </Text>
      <View style={styles_ticket.tableHeader}>
        {colDefs.map((colDef, idx) => {
          return colDef.headerName === headerNameAl100 ? null : (
            <Text
              key={idx}
              style={{
                ...styles_ticket.cell,
                flex: colDef.flex,
                width: colDef.width,
                minWidth: colDef.minWidth,
                fontWeight: 'bold',
                paddingTop: 0,
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
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Text
            style={{
              ...styles_ticket.cell,
              paddingBottom: 0,
              ...getFieldStyle(colDefHederNameAl100?.headerName || ''),
            }}
          >
            {getCellValue(colDefHederNameAl100!, item)}
          </Text>
          <View
            style={{
              ...styles_ticket.tableRow,
              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
            }}
          >
            {colDefs.map((colDef, idxCol) => {
              return colDef.headerName === headerNameAl100 ? null : (
                <Text
                  key={`${idx}-${idxCol}`}
                  style={{
                    ...styles_ticket.cell,
                    flex: colDef.flex,
                    width: colDef.width,
                    minWidth: colDef.minWidth,
                    paddingTop: 0,
                    ...getFieldStyle(colDef.headerName || ''),
                  }}
                >
                  {colDef.type === 'pen4'
                    ? Number(getCellValue(colDef, item)).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        }
                      )
                    : colDef.type === 'pen'
                    ? Number(getCellValue(colDef, item)).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )
                    : getCellValue(colDef, item)}
                </Text>
              )
            })}
          </View>
        </View>
      ))}
    </View>
  )
}
