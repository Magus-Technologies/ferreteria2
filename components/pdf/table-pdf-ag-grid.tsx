import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { Column } from 'ag-grid-community'

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: 'black',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  titleTable: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
    padding: '4px 8px',
    overflow: 'hidden',
  },
})

export default function TablePdfAgGrid({
  rowData,
  colDefs,
  nameFile,
}: {
  rowData: Record<string, unknown>[]
  colDefs: Column[]
  nameFile: string
}) {
  return (
    <Document title={nameFile}>
      <Page size='A4' style={styles.page}>
        <View style={styles.titleTable}>
          <Text>{nameFile}</Text>
        </View>

        <View style={styles.sectionTable}>
          <View style={styles.tableHeader}>
            {colDefs.map((col, idx) => {
              const colDef = col.getColDef()
              return (
                <Text
                  key={idx}
                  style={{
                    ...styles.cell,
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
                ...styles.tableRow,
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
              }}
            >
              {colDefs.map(col => {
                const colDef = col.getColDef()
                return (
                  <Text
                    key={colDef.headerName}
                    style={{
                      ...styles.cell,
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
