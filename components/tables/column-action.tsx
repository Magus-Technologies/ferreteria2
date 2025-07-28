import { Tooltip } from 'antd'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import usePermission from '~/hooks/use-permission'

interface ColumnActionProps {
  id: string
  permiso: string
  children?: React.ReactNode
  childrenMiddle?: React.ReactNode
}

export default function ColumnAction({
  id,
  permiso,
  children,
  childrenMiddle,
}: ColumnActionProps) {
  const can = usePermission()

  return (
    <div className='flex items-center gap-2 h-full'>
      {permiso && can(`${permiso}.update`) && (
        <Tooltip title='Editar'>
          <MdEditSquare
            onClick={() => id}
            size={15}
            className='cursor-pointer text-yellow-500 hover:scale-105 transition-all active:scale-95'
          />
        </Tooltip>
      )}
      {childrenMiddle}
      {permiso && can(`${permiso}.delete`) && (
        <Tooltip title='Eliminar'>
          <MdDelete
            size={15}
            className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
          />
        </Tooltip>
      )}
      {children}
    </div>
  )
}
