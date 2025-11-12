import { Popconfirm, Tooltip } from 'antd'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import usePermission from '~/hooks/use-permission'
import {
  UseMutationActionProps,
  useServerMutation,
} from '~/hooks/use-server-mutation'

interface ColumnActionProps<T> {
  id: T
  permiso: string
  children?: React.ReactNode
  childrenMiddle?: React.ReactNode
  showDelete?: boolean
  onEdit?: () => void
  showEdit?: boolean
  titleDelete?: string
  propsDelete?: UseMutationActionProps<{ id: T }, unknown>
}

export default function ColumnAction<T>({
  id,
  permiso,
  children,
  childrenMiddle,
  showDelete = true,
  onEdit,
  showEdit = true,
  titleDelete = 'Eliminar',
  propsDelete,
}: ColumnActionProps<T>) {
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
            } min-w-fit`}
          />
        </Tooltip>
      )}
      {childrenMiddle}
      {permiso && can(`${permiso}.delete`) && showDelete && (
        <Tooltip title={titleDelete}>
          <Popconfirm
            title={titleDelete}
            description={`¿Estas seguro de ${titleDelete.toLowerCase()} este registro?`}
            onConfirm={() => deleteAction({ id })}
            okText={titleDelete}
            cancelText='Cancelar'
          >
            <MdDelete
              size={15}
              className={`text-rose-700 hover:scale-105 transition-all active:scale-95 ${
                deleteLoading
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer'
              } min-w-fit`}
            />
          </Popconfirm>
        </Tooltip>
      )}
      {children}
    </div>
  )
}
