'use client'

import { AgGridReact } from 'ag-grid-react'
import TableBase, { TableBaseProps } from './table-base'
import { useRef } from 'react'
import ButtonBase from '../buttons/button-base'
import { exportAGGridDataToJSON, exportAGGridDataToPDF } from '~/utils/ag-grid'
import { RiFileExcel2Fill } from 'react-icons/ri'
import { Popover, Tooltip } from 'antd'
import { FaFilePdf } from 'react-icons/fa6'
import { PiFilePdfFill } from 'react-icons/pi'
import { HiMiniViewColumns } from 'react-icons/hi2'
import SelectColumns from './select-columns'

interface TableWithTitleProps<T> extends TableBaseProps<T> {
  title: string
  exportExcel?: boolean
  exportPdf?: boolean
}

export default function TableWithTitle<T>({
  title,
  exportExcel = true,
  exportPdf = true,
  ...props
}: TableWithTitleProps<T>) {
  const tableRef = useRef<AgGridReact<T>>(null)

  return (
    <div className='flex flex-col gap-2 size-full'>
      <div className='flex items-center justify-between gap-2'>
        <div className='font-semibold text-slate-700 text-xl'>{title}</div>
        <div className='flex gap-2 items-center'>
          <Tooltip title='Ver Columnas'>
            <Popover
              content={<SelectColumns gridRef={tableRef} />}
              trigger='click'
            >
              <ButtonBase color='warning' size='md' className='!px-3'>
                <HiMiniViewColumns />
              </ButtonBase>
            </Popover>
          </Tooltip>
          {exportExcel && (
            <Tooltip title='Exportar a Excel'>
              <ButtonBase
                onClick={() => {
                  if (tableRef.current)
                    exportAGGridDataToJSON(tableRef.current, title)
                }}
                color='success'
                size='md'
                className='!px-3'
              >
                <RiFileExcel2Fill />
              </ButtonBase>
            </Tooltip>
          )}
          {exportPdf && (
            <>
              <Tooltip title='Exportar a PDF Vertical'>
                <ButtonBase
                  onClick={() => {
                    if (tableRef.current)
                      exportAGGridDataToPDF(tableRef.current, title, 'vertical')
                  }}
                  color='danger'
                  size='md'
                  className='!px-3'
                >
                  <FaFilePdf />
                </ButtonBase>
              </Tooltip>
              <Tooltip title='Exportar a PDF Horizontal'>
                <ButtonBase
                  onClick={() => {
                    if (tableRef.current)
                      exportAGGridDataToPDF(
                        tableRef.current,
                        title,
                        'horizontal'
                      )
                  }}
                  color='danger'
                  size='md'
                  className='!px-3'
                >
                  <PiFilePdfFill />
                </ButtonBase>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <TableBase ref={tableRef} {...props} />
    </div>
  )
}
