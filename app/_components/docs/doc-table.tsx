import { Text, View } from '@react-pdf/renderer'
import { getCellValue } from '~/utils/docs'
import { ColDef } from 'ag-grid-community'
import { styles_globales } from '~/components/pdf/table-pdf-ag-grid'
import { styles_docs } from './styles'

export default function DocTable<T>({
  colDefs,
  rowData,
}: {
  colDefs: ColDef[]
  rowData: T[]
}) {
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
