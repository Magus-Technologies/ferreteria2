import { themeQuartz, iconSetQuartzLight, ColTypeDef } from 'ag-grid-community'

export const themeTable = themeQuartz.withPart(iconSetQuartzLight).withParams({
  backgroundColor: '#ffffff',
  browserColorScheme: 'light',
  columnBorder: false,
  fontFamily: 'Ubuntu',
  foregroundColor: 'rgb(46, 55, 66)',
  headerBackgroundColor: '#F9FAFB',
  headerFontSize: 'var(--text-sm)',
  fontSize: 'var(--text-sm)',
  headerFontWeight: 600,
  headerTextColor: 'var(--color-slate-600)',
  oddRowBackgroundColor: '#F9FAFB',
  rowBorder: false,
  sidePanelBorder: false,
  spacing: 4,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
})

export const columnTypes: {
  [key: string]: ColTypeDef
} = {
  usd: {
    valueFormatter: params =>
      `$. ${params.value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
  },
  pen: {
    valueFormatter: params =>
      `S/. ${params.value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
  },
}
