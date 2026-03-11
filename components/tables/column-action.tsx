'use client'

import { Popconfirm, Tooltip } from 'antd'
import { useState } from 'react'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import usePermissionHook from '~/hooks/use-permission'
import {
  UseMutationActionProps,
  useServerMutation,
} from '~/hooks/use-server-mutation'
import { autorizacionesApi } from '~/lib/api/autorizaciones'
import ModalSolicitarAutorizacion from '~/components/autorizaciones/modal-solicitar-autorizacion'

interface AutorizacionConfig {
  modulo: string
  descripcion?: string
}

interface ColumnActionProps<T> {
  id: T
  permiso: string
  children?: React.ReactNode
  childrenMiddle?: React.ReactNode
  showDelete?: boolean
  onEdit?: () => void
  showEdit?: boolean
  titleDelete?: string
  autorizacion?: AutorizacionConfig
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
  autorizacion,
  propsDelete,
}: ColumnActionProps<T>) {
  const { can } = usePermissionHook()
  const [verificando, setVerificando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAccion, setModalAccion] = useState<'editar' | 'eliminar'>('editar')
  const [solicitando, setSolicitando] = useState(false)

  const { disabled, disabledTooltip, action, ...restMutationProps } = propsDelete || {}

  // Provide a default no-op action if none is provided
  const defaultAction = async () => ({ data: undefined, error: undefined })

  const { execute: deleteAction, loading: deleteLoading } = useServerMutation({
    action: action || defaultAction,
    ...restMutationProps,
  })

  // Verificar autorización antes de ejecutar una acción
  const verificarYEjecutar = async (accion: 'editar' | 'eliminar', ejecutar: () => void) => {
    if (!autorizacion) {
      ejecutar()
      return
    }

    setVerificando(true)
    try {
      const res = await autorizacionesApi.verificar(autorizacion.modulo, accion)
      const data = res.data

      if (!data?.requiere || data?.tiene_autorizacion) {
        ejecutar()
        return
      }

      // Requiere y no tiene → mostrar modal de solicitud
      setModalAccion(accion)
      setModalOpen(true)
    } catch {
      // Fail-open: si hay error en la verificación, permitir la acción
      ejecutar()
    } finally {
      setVerificando(false)
    }
  }

  const handleEdit = () => {
    if (!onEdit) return
    verificarYEjecutar('editar', onEdit)
  }

  const handleDelete = () => {
    verificarYEjecutar('eliminar', () => deleteAction({ id }))
  }

  const handleSolicitar = async () => {
    setSolicitando(true)
    try {
      const desc = autorizacion?.descripcion || `${modalAccion} registro`
      await autorizacionesApi.solicitar({
        modulo: autorizacion!.modulo,
        accion: modalAccion,
        descripcion: desc,
      })
    } finally {
      setSolicitando(false)
    }
  }

  const loading = verificando || deleteLoading

  return (
    <>
      <div className='flex items-center gap-2 h-full'>
        {permiso && can(`${permiso}.update`) && showEdit && (
          <Tooltip title='Editar'>
            <MdEditSquare
              onClick={handleEdit}
              size={15}
              className={`text-yellow-500 hover:scale-105 transition-all active:scale-95 ${
                loading
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
            ) : autorizacion ? (
              <MdDelete
                onClick={handleDelete}
                size={15}
                className={`text-rose-700 hover:scale-105 transition-all active:scale-95 ${
                  loading
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'cursor-pointer'
                } min-w-fit`}
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
                    loading
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

      {autorizacion && (
        <ModalSolicitarAutorizacion
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          modulo={autorizacion.modulo}
          accion={modalAccion}
          descripcion={autorizacion.descripcion || `${modalAccion} registro`}
          onSolicitar={handleSolicitar}
          solicitando={solicitando}
        />
      )}
    </>
  )
}
