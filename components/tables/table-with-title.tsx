'use client'

import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import TableBase from './table-base'
import { useRef } from 'react'
import ButtonBase from '../buttons/button-base'
import { exportAGGridDataToJSON } from '~/utils/ag-grid'
import { RiFileExcel2Fill } from 'react-icons/ri'
import { Tooltip } from 'antd'

interface TableWithTitleProps<T> extends AgGridReactProps<T> {
  title: string
  exportExcel?: boolean
}

export default function TableWithTitle<T>({
  title,
  exportExcel = true,
  ...props
}: TableWithTitleProps<T>) {
  const tableRef = useRef<AgGridReact<T>>(null)
  return (
    <div className='flex flex-col gap-2 size-full'>
      <div className='flex items-center justify-between gap-2'>
        <div className='font-semibold text-slate-700 text-lg'>{title}</div>
        <div>
          {exportExcel && (
            <Tooltip title='Exportar a Excel'>
              <ButtonBase
                onClick={() => {
                  if (tableRef.current)
                    exportAGGridDataToJSON(tableRef.current, title)
                }}
                color='warning'
                size='md'
                className='!px-3'
              >
                <RiFileExcel2Fill />
              </ButtonBase>
            </Tooltip>
          )}
        </div>
      </div>
      <TableBase ref={tableRef} {...props} />
    </div>
  )
}
