'use client'

import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import { columnTypes, themeTable } from './table-theme'
import { AG_GRID_LOCALE_ES } from '~/lib/ag-grid-es'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { RefObject } from 'react'

ModuleRegistry.registerModules([AllCommunityModule])

interface TableBaseProps<T> extends AgGridReactProps<T> {
  ref?: RefObject<AgGridReact<T> | null>
}

export default function TableBase<T>({ ref, ...props }: TableBaseProps<T>) {
  return (
    <AgGridReact<T>
      {...props}
      ref={ref}
      theme={themeTable}
      columnTypes={columnTypes}
      localeText={AG_GRID_LOCALE_ES}
    />
  )
}
