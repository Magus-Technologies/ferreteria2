'use client'

import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import { columnTypes, themeTable } from './table-theme'
import { AG_GRID_LOCALE_ES } from '~/lib/ag-grid-es'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { RefObject } from 'react'

ModuleRegistry.registerModules([AllCommunityModule])

export interface TableBaseProps<T>
  extends Omit<
    AgGridReactProps<T>,
    'theme' | 'columnTypes' | 'localeText' | 'enableFilterHandlers'
  > {
  ref?: RefObject<AgGridReact<T> | null>
  headerBackgroundColor?: string
}

export default function TableBase<T>({
  ref,
  headerBackgroundColor,
  className = '',
  ...props
}: TableBaseProps<T>) {
  return (
    <AgGridReact<T>
      {...props}
      ref={ref}
      theme={themeTable.withParams({ headerBackgroundColor })}
      columnTypes={columnTypes}
      localeText={AG_GRID_LOCALE_ES}
      enableFilterHandlers={true}
      className={`shadow-lg rounded-xl overflow-hidden ${className}`}
    />
  )
}
