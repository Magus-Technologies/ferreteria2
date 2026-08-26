import { themeQuartz, iconSetQuartzLight } from 'ag-grid-community'

export const themeTable = themeQuartz.withPart(iconSetQuartzLight).withParams({
  backgroundColor: '#ffffff',
  browserColorScheme: 'light',
  columnBorder: false,
  fontFamily: 'Ubuntu',
  foregroundColor: 'rgb(46, 55, 66)',
  headerBackgroundColor: 'var(--color-slate-600)',
  headerFontSize: '0.93rem',
  fontSize: '0.93rem',
  headerFontWeight: 600,
  headerTextColor: 'var(--color-white)',
  oddRowBackgroundColor: '#F9FAFB',
  selectedRowBackgroundColor: 'var(--color-cyan-800)',
  rowBorder: false,
  // Sin padding vertical en las celdas: el contenido usa toda la altura de la
  // fila (rowHeight, 42px por defecto en table-base) en vez de quedar apretado
  // entre un margen arriba y abajo. El padding HORIZONTAL no se toca — lo
  // controla `spacing` y sigue separando el texto del borde de la columna.
  rowVerticalPaddingScale: 0,
  sidePanelBorder: false,
  spacing: 4,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
})
