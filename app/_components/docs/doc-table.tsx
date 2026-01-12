import { Text, View } from '@react-pdf/renderer'
import { getCellValue } from '~/utils/docs'
import { ColDef } from 'ag-grid-community'
import { styles_globales } from '~/components/pdf/table-pdf-ag-grid'
import { styles_docs } from './styles'

export default function DocTable<T>({
  colDefs,
  rowData,
  getEstiloCampo,
}: {
  colDefs: ColDef[]
  rowData: T[]
  getEstiloCampo?: (campo: string) => { fontFamily?: string; fontSize?: number; fontWeight?: string }
}) {
  // Función helper para obtener estilos de un campo
  const getFieldStyle = (headerName: string) => {
    if (!getEstiloCampo) return {}
    
    // Mapear nombres de columnas a campos de configuración
    const fieldMap: Record<string, string> = {
      // Campos comunes
      'Código': 'tabla_codigo',
      'Descripción': 'tabla_descripcion',
      'Cant.': 'tabla_cantidad',
      'Unid.': 'tabla_unidad',
      'P. Unit.': 'tabla_precio',
      'Desc.': 'tabla_descuento',
      'Subtotal': 'tabla_subtotal',
      // Campos de ingreso/salida
      'Cantidad': 'tabla_cantidad',
      'Unidad Derivada': 'tabla_unidad',
      'Costo': 'tabla_costo',
      // Campos de venta
      'P.U.': 'tabla_precio',
      'Subt.': 'tabla_subtotal',
    }
    
    const campo = fieldMap[headerName]
    return campo ? getEstiloCampo(campo) : {}
  }

  const colDefs_with_index = [
    {
      headerName: '#',
      colId: '#',
      width: 20,
      minWidth: 20,
      type: 'numberColumn',
    },
    ...colDefs,
  ]
  return (
    <View style={styles_globales.sectionTable}>
      <View style={styles_docs.tableHeader}>
        {colDefs_with_index.map((colDef, idx) => {
          return (
            <Text
              key={idx}
              style={{
                ...styles_globales.cell,
                flex: colDef.flex,
                width: colDef.width,
                minWidth: colDef.minWidth,
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
            ...styles_docs.tableRow,
            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
          }}
        >
          {colDefs_with_index.map((colDef, idxCol) => {
            return (
              <Text
                key={`${idx}-${idxCol}`}
                style={{
                  ...styles_globales.cell,
                  flex: colDef.flex,
                  width: colDef.width,
                  minWidth: colDef.minWidth,
                  ...getFieldStyle(colDef.headerName || ''),
                }}
              >
                {colDef.colId === '#' ? idx + 1 : getCellValue(colDef, item)}
              </Text>
            )
          })}
        </View>
      ))}
    </View>
  )
}
