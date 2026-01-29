import { Popconfirm, Tooltip } from 'antd'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import usePermissionHook from '~/hooks/use-permission'
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
  propsDelete?: UseMutationActionProps<{ id: T }, unknown> & {
    disabled?: boolean
    disabledTooltip?: string
  }
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
  const { can } = usePermissionHook()

  const { disabled, disabledTooltip, action, ...restMutationProps } = propsDelete || {}

  // Provide a default no-op action if none is provided
  const defaultAction = async () => ({ data: undefined, error: undefined })
  
  const { execute: deleteAction, loading: deleteLoading } = useServerMutation({
    action: action || defaultAction,
    ...restMutationProps,
  })

  const isDeleteDisabled = disabled || deleteLoading

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
        <Tooltip title={disabled ? disabledTooltip : titleDelete}>
          {disabled ? (
            <MdDelete
              size={15}
              className="text-gray-400 opacity-50 cursor-not-allowed min-w-fit"
            />
          ) : (
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
          )}
        </Tooltip>
      )}
      {children}
    </div>
  )
}
