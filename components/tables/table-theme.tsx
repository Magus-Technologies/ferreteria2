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
  sidePanelBorder: false,
  spacing: 4,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
})
