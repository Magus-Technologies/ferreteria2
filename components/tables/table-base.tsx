'use client'

import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import { themeTable } from './table-theme'
import { AG_GRID_LOCALE_ES } from '~/lib/ag-grid-es'
import {
  AllCommunityModule,
  ButtonStyleParams,
  CheckboxStyleParams,
  CoreParams,
  InputStyleParams,
  ModuleRegistry,
  TabStyleParams,
  ValueGetterParams,
} from 'ag-grid-community'
import { RefObject } from 'react'
import useColumnTypes from './hooks/use-column-types'

ModuleRegistry.registerModules([AllCommunityModule])

export interface TableBaseProps<T>
  extends Omit<
    AgGridReactProps<T>,
    | 'theme'
    | 'columnTypes'
    | 'localeText'
    | 'enableFilterHandlers'
    | 'rowSelection'
  > {
  ref?: RefObject<AgGridReact<T> | null>
  paramsOfThemeTable?: Partial<
    CoreParams &
      ButtonStyleParams &
      CheckboxStyleParams &
      TabStyleParams &
      InputStyleParams
  >
  rowSelection?: boolean
  withNumberColumn?: boolean
}

export default function TableBase<T>({
  ref,
  paramsOfThemeTable,
  className = '',
  rowSelection = true,
  columnDefs,
  withNumberColumn = true,
  onDragStopped,
  ...props
}: TableBaseProps<T>) {
  const { columnTypes } = useColumnTypes()

  return (
    <>
      <style>
        {`
      .ag-row-selected .ag-cell {
        color: white !important;
        font-weight: 700;
      }
    `}
      </style>

      <AgGridReact<T>
        {...props}
        ref={ref}
        onDragStopped={event => {
          if (props.rowDragManaged && withNumberColumn)
            event.api.refreshCells({ force: true })
          onDragStopped?.(event)
        }}
        theme={themeTable.withParams(paramsOfThemeTable ?? {})}
        columnTypes={columnTypes}
        localeText={AG_GRID_LOCALE_ES}
        enableFilterHandlers={true}
        className={`shadow-lg rounded-xl overflow-hidden ${className}`}
        rowSelection={rowSelection ? 'single' : undefined}
        columnDefs={[
          ...(withNumberColumn
            ? [
                {
                  headerName: '#',
                  width: props.rowDragManaged ? 65 : 50,
                  valueGetter: (params: ValueGetterParams<T>) =>
                    (params.node?.rowIndex ?? 0) + 1,
                  type: 'numberColumn',
                  rowDrag: props.rowDragManaged,
                },
              ]
            : []),
          ...(columnDefs ?? []),
        ]}
      />
    </>
  )
}
