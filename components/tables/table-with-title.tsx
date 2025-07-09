import { AgGridReactProps } from 'ag-grid-react'
import TableBase from './table-base'

interface TableWithTitleProps<T> extends AgGridReactProps<T> {
  title: string
}

export default function TableWithTitle<T>({
  title,
  ...props
}: TableWithTitleProps<T>) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='font-semibold text-slate-700 text-xl'>{title}</div>
      <TableBase {...props} />
    </div>
  )
}
