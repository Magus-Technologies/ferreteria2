import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { Column } from 'ag-grid-community'

export const styles_globales = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: 'black',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTable: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    fontSize: 9,
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid #bfbcbc',
    fontWeight: 'bold',
    backgroundColor: 'rgb(69 85 108)',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    color: '#fff',
    paddingVertical: 2,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '0.5px solid #e5e5e5',
    paddingVertical: 2,
    fontSize: 8,
  },
  cell: {
    display: 'flex',
    padding: '4px 16px',
  },
})

const styles = StyleSheet.create({
  titleTable: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
})

export default function TablePdfAgGrid({
  rowData,
  colDefs,
  nameFile,
  orientation = 'vertical',
}: {
  rowData: Record<string, unknown>[]
  colDefs: Column[]
  nameFile: string
  orientation?: 'vertical' | 'horizontal'
}) {
  return (
    <Document title={nameFile}>
      <Page
        size='A4'
        style={styles_globales.page}
        orientation={orientation === 'vertical' ? 'portrait' : 'landscape'}
      >
        <View style={styles.titleTable}>
          <Text>{nameFile}</Text>
        </View>

        <View style={styles_globales.sectionTable}>
          <View style={styles_globales.tableHeader}>
            {colDefs.map((col, idx) => {
              const colDef = col.getColDef()
              return (
                <Text
                  key={idx}
                  style={{
                    ...styles_globales.cell,
                    flex: colDef.flex,
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
                ...styles_globales.tableRow,
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
              }}
            >
              {colDefs.map((col, idxCol) => {
                const colDef = col.getColDef()
                return (
                  <Text
                    key={`${idx}-${idxCol}`}
                    style={{
                      ...styles_globales.cell,
                      flex: colDef.flex,
                    }}
                  >
                    {String(item[colDef.headerName!])}
                  </Text>
                )
              })}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
