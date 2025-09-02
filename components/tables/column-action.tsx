import { Popconfirm, Tooltip } from 'antd'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import usePermission from '~/hooks/use-permission'
import {
  UseMutationActionProps,
  useServerMutation,
} from '~/hooks/use-server-mutation'

interface ColumnActionProps {
  id: string
  permiso: string
  children?: React.ReactNode
  childrenMiddle?: React.ReactNode
  showDelete?: boolean
  onEdit?: () => void
  showEdit?: boolean

  propsDelete?: UseMutationActionProps<{ id: number }, unknown>
}

export default function ColumnAction({
  id,
  permiso,
  children,
  childrenMiddle,
  showDelete = true,
  onEdit,
  showEdit = true,
  propsDelete,
}: ColumnActionProps) {
  const can = usePermission()

  const { execute: deleteAction, loading: deleteLoading } = useServerMutation(
    propsDelete!
  )

  return (
    <div className='flex items-center gap-2 h-full'>
      {permiso && can(`${permiso}.update`) && showEdit && (
        <Tooltip title='Editar'>
          <MdEditSquare
            onClick={onEdit}
            size={15}
            className={`text-yellow-500 hover:scale-105 transition-all active:scale-95 ${
              deleteLoading
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : 'cursor-pointer'
            }`}
          />
        </Tooltip>
      )}
      {childrenMiddle}
      {permiso && can(`${permiso}.delete`) && showDelete && (
        <Tooltip title='Eliminar'>
          <Popconfirm
            title='Eliminar'
            description='¿Estas seguro de eliminar este registro?'
            onConfirm={() => deleteAction({ id: Number(id) })}
            okText='Eliminar'
            cancelText='Cancelar'
          >
            <MdDelete
              size={15}
              className={`text-rose-700 hover:scale-105 transition-all active:scale-95 ${
                deleteLoading
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer'
              }`}
            />
          </Popconfirm>
        </Tooltip>
      )}
      {children}
    </div>
  )
}
