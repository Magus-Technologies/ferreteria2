'use client'

import { useState, useEffect } from 'react'
import { Modal, App, Tabs, Spin, Badge } from 'antd'
import TitleForm from '~/components/form/title-form'
import { permissionsApi, Permission } from '~/lib/api/permissions'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import TabRoles from './asignar-permisos/tab-roles'
import TabPermisosDirectos from './asignar-permisos/tab-permisos-directos'
import TabResumen from './asignar-permisos/tab-resumen'
import { classOkButtonModal } from '~/lib/clases'

interface ModalAsignarPermisosProps {
  open: boolean
  setOpen: (open: boolean) => void
  userId: string
  userName: string
}

export default function ModalAsignarPermisos({
  open,
  setOpen,
  userId,
  userName,
}: ModalAsignarPermisosProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('roles')
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])

  const { data: permissionsData = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await permissionsApi.getAll()
      return Array.isArray(response.data) ? response.data : []
    },
  })

  const { data: rolesData = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      console.log('🔵 Fetching roles...')
      console.log('🔵 API URL:', process.env.NEXT_PUBLIC_API_URL)
      const response = await permissionsApi.getRoles()
      console.log('🔵 Roles response completa:', response)
      console.log('🔵 Roles response.data:', response.data)
      console.log('🔵 Es array?:', Array.isArray(response.data))
      const roles = Array.isArray(response.data) ? response.data : []
      console.log('🔵 Roles finales:', roles)
      return roles
    },
  })

  const { data: userPermissions, isLoading: loadingUserPermissions, refetch: refetchUserPermissions } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const response = await permissionsApi.getUserPermissions(userId)
      return response.data
    },
    enabled: open && !!userId && userId !== '',
  })

  useEffect(() => {
    if (userPermissions?.direct_permissions && userPermissions?.roles) {
      const permissionIds = userPermissions.direct_permissions.map(p => p.id)
      const roleIds = userPermissions.roles.map(r => r.id)
      
      setSelectedPermissions(permissionIds)
      setSelectedRoles(roleIds)
    }
  }, [userPermissions])

  const assignMutation = useMutation({
    mutationFn: async () => {
      await permissionsApi.assignRolesToUser(userId, selectedRoles)
      await permissionsApi.assignPermissionsToUser(userId, selectedPermissions)
    },
    onSuccess: () => {
      message.success('Permisos y roles asignados correctamente')
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] })
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      refetchUserPermissions()
      setOpen(false)
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al asignar permisos')
    },
  })

  const handleSubmit = () => {
    assignMutation.mutate()
  }

  const handleCancel = () => {
    setOpen(false)
    setSelectedRoles([])
    setSelectedPermissions([])
    setActiveTab('roles')
  }

  const groupedPermissions = (permissionsData || []).reduce((acc, permission) => {
    const parts = permission.name.split('.')
    const module = parts[0]
    if (!acc[module]) acc[module] = []
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const loading = loadingPermissions || loadingRoles || loadingUserPermissions

  return (
    <Modal
      title={<TitleForm>Asignar Permisos a {userName}</TitleForm>}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={1000}
      centered
      maskClosable={false}
      keyboard={false}
      okText="Guardar Cambios"
      cancelText="Cancelar"
      confirmLoading={assignMutation.isPending}
      okButtonProps={{
        className: classOkButtonModal,
      }}
      cancelButtonProps={{
        className: 'rounded-xl',
      }}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" tip="Cargando permisos..." />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'roles',
              label: (
                <span className="flex items-center gap-2">
                  <Badge count={userPermissions?.roles?.length || 0} showZero>
                    👥 Asignar Roles
                  </Badge>
                </span>
              ),
              children: (
                <TabRoles
                  rolesData={rolesData}
                  selectedRoles={selectedRoles}
                  onRolesChange={setSelectedRoles}
                />
              ),
            },
            {
              key: 'permissions',
              label: (
                <span className="flex items-center gap-2">
                  <Badge count={userPermissions?.direct_permissions?.length || 0} showZero>
                    🔐 Permisos Directos
                  </Badge>
                </span>
              ),
              children: (
                <TabPermisosDirectos
                  groupedPermissions={groupedPermissions}
                  selectedPermissions={selectedPermissions}
                  onPermissionsChange={setSelectedPermissions}
                />
              ),
            },
            {
              key: 'summary',
              label: '📋 Resumen',
              children: <TabResumen userPermissions={userPermissions} />,
            },
          ]}
        />
      )}
    </Modal>
  )
}
