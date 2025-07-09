import { themeQuartz, iconSetQuartzLight, ColTypeDef } from 'ag-grid-community'

export const themeTable = themeQuartz.withPart(iconSetQuartzLight).withParams({
  backgroundColor: '#ffffff',
  browserColorScheme: 'light',
  columnBorder: false,
  fontFamily: 'Ubuntu',
  foregroundColor: 'rgb(46, 55, 66)',
  headerBackgroundColor: '#F9FAFB',
  headerFontSize: 'var(--text-base)',
  fontSize: 'var(--text-sm)',
  headerFontWeight: 600,
  headerTextColor: 'var(--color-slate-600)',
  oddRowBackgroundColor: '#F9FAFB',
  rowBorder: false,
  sidePanelBorder: false,
  spacing: 5,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
})

export const columnTypes: {
  [key: string]: ColTypeDef
} = {
  currency: {
    width: 150,
    valueFormatter: params =>
      params.value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
  },
  shaded: {
    cellClass: 'shaded-class',
  },
}
