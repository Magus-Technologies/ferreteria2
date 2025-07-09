'use client'

import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import { columnTypes, themeTable } from './table-theme'
import { AG_GRID_LOCALE_ES } from '~/lib/ag-grid-es'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

export default function TableBase<T>(props: AgGridReactProps<T>) {
  return (
    <AgGridReact<T>
      {...props}
      theme={themeTable}
      columnTypes={columnTypes}
      localeText={AG_GRID_LOCALE_ES}
    />
  )
}
