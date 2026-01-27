'use client'

import { useState } from 'react'
import { App, Badge, Tooltip } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permissionsApi, Role } from '~/lib/api/permissions'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import ButtonBase from '~/components/buttons/button-base'
import { MdAdd, MdEdit, MdDelete, MdSecurity } from 'react-icons/md'
import ModalRolForm from './_components/modals/modal-rol-form'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import NoAutorizado from '~/components/others/no-autorizado'

export default function RolesPage() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const { can } = usePermissionHook()
  
  const [openModal, setOpenModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Obtener todos los roles
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await permissionsApi.getRoles()
      return response.data || []
    },
  })

  // Mutation para eliminar rol
  const deleteMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return await permissionsApi.deleteRole(roleId)
    },
    onSuccess: () => {
      message.success('Rol eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al eliminar rol')
    },
  })

  const handleCreate = () => {
    setSelectedRole(null)
    setModalMode('create')
    setOpenModal(true)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setModalMode('edit')
    setOpenModal(true)
  }

  const handleDelete = (role: Role) => {
    if (role.name === 'admin_global') {
      message.error('No se puede eliminar el rol de administrador global')
      return
    }

    modal.confirm({
      title: '¿Eliminar Rol?',
      content: (
        <div>
          <p>¿Estás seguro de eliminar el rol <strong>{role.name}</strong>?</p>
          <p className="text-sm text-gray-500 mt-2">
            Los usuarios con este rol perderán sus permisos asociados.
          </p>
        </div>
      ),
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => deleteMutation.mutate(role.id),
    })
  }

  // Verificar permisos
  if (!can(permissions.CONFIGURACION_ROLES_INDEX)) {
    return (
      <ContenedorGeneral>
        <NoAutorizado />
      </ContenedorGeneral>
    )
  }

  return (
    <ContenedorGeneral>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <MdSecurity className="text-purple-600" />
              Gestión de Roles
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los roles y sus permisos asociados
            </p>
          </div>
          
          <ButtonBase
            color="info"
            size="lg"
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <MdAdd size={20} />
            Crear Nuevo Rol
          </ButtonBase>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total de Roles</p>
                <p className="text-3xl font-bold">{rolesData?.length || 0}</p>
              </div>
              <MdSecurity className="text-5xl text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Roles Personalizados</p>
                <p className="text-3xl font-bold">
                  {rolesData?.filter(r => r.name !== 'admin_global').length || 0}
                </p>
              </div>
              <MdEdit className="text-5xl text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Permisos Totales</p>
                <p className="text-3xl font-bold">
                  {rolesData?.reduce((sum, role) => sum + (role.permissions?.length || 0), 0) || 0}
                </p>
              </div>
              <Badge count="✓" style={{ backgroundColor: '#52c41a' }}>
                <div className="w-12 h-12" />
              </Badge>
            </div>
          </div>
        </div>

        {/* Lista de Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando roles...</p>
            </div>
          ) : rolesData && rolesData.length > 0 ? (
            rolesData.map(role => (
              <div
                key={role.id}
                className="border-2 border-gray-200 rounded-lg p-5 hover:border-purple-400 hover:shadow-lg transition-all bg-white"
              >
                {/* Header del Card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                      {role.name === 'admin_global' && (
                        <Badge count="ADMIN" style={{ backgroundColor: '#f5222d' }} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{role.descripcion}</p>
                  </div>
                </div>

                {/* Permisos */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge
                      count={role.permissions?.length || 0}
                      showZero
                      style={{ backgroundColor: '#52c41a' }}
                    />
                    <span>permisos asignados</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Tooltip title="Editar rol">
                    <ButtonBase
                      color="warning"
                      size="sm"
                      onClick={() => handleEdit(role)}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <MdEdit size={16} />
                      Editar
                    </ButtonBase>
                  </Tooltip>

                  {role.name !== 'admin_global' && (
                    <Tooltip title="Eliminar rol">
                      <ButtonBase
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(role)}
                        className="flex items-center justify-center gap-1"
                      >
                        <MdDelete size={16} />
                      </ButtonBase>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MdSecurity className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay roles creados</p>
              <ButtonBase
                color="info"
                size="md"
                onClick={handleCreate}
                className="mt-4"
              >
                Crear Primer Rol
              </ButtonBase>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ModalRolForm
        open={openModal}
        setOpen={setOpenModal}
        role={selectedRole}
        mode={modalMode}
      />
    </ContenedorGeneral>
  )
}
