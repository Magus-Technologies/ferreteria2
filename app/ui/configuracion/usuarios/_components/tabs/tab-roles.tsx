'use client'

import { useState } from 'react'
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash, FaUserShield } from 'react-icons/fa'
import { permissionsApi, type Role } from '~/lib/api/permissions'

const ROLES_GESTION_KEY = ['roles-gestion']

export default function TabRoles() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Role | null>(null)
  const [form] = Form.useForm<{ name: string; descripcion: string }>()

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ROLES_GESTION_KEY,
    queryFn: async () => {
      const res = await permissionsApi.getRolesGestion()
      return res.data?.data ?? []
    },
  })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ROLES_GESTION_KEY })

  const guardarMutation = useMutation({
    mutationFn: async (values: { name: string; descripcion: string }) => {
      if (editando) {
        return permissionsApi.updateRole(editando.id, values)
      }
      return permissionsApi.createRole(values)
    },
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'Error al guardar el rol')
        return
      }
      message.success(editando ? 'Rol actualizado' : 'Rol creado')
      cerrarModal()
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'Error al guardar el rol'),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => permissionsApi.deleteRole(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'No se pudo eliminar')
        return
      }
      message.success('Rol eliminado')
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'No se pudo eliminar'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: boolean }) =>
      permissionsApi.toggleRoleEstado(id, estado),
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'No se pudo cambiar el estado')
        return
      }
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'No se pudo cambiar el estado'),
  })

  const abrirCrear = () => {
    setEditando(null)
    form.resetFields()
    setModalOpen(true)
  }

  const abrirEditar = (rol: Role) => {
    setEditando(rol)
    form.setFieldsValue({ name: rol.name, descripcion: rol.descripcion })
    setModalOpen(true)
  }

  const cerrarModal = () => {
    setModalOpen(false)
    setEditando(null)
    form.resetFields()
  }

  const esAdminGlobal = (rol: Role) => rol.name === 'admin_global'

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, rol: Role) => (
        <span className={`font-medium ${rol.estado === false ? 'text-gray-400 line-through' : ''}`}>
          {name}
        </span>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (d: string) => <span className="text-gray-600 text-sm">{d}</span>,
    },
    {
      title: 'Usuarios',
      dataIndex: 'users_count',
      key: 'users_count',
      width: 100,
      align: 'center' as const,
      render: (c: number = 0) => <Tag color={c > 0 ? 'blue' : 'default'}>{c}</Tag>,
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, rol: Role) => (
        <Switch
          size="small"
          checked={rol.estado !== false}
          disabled={esAdminGlobal(rol) || toggleMutation.isPending}
          onChange={(checked) => toggleMutation.mutate({ id: rol.id, estado: checked })}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, rol: Role) => {
        const enUso = (rol.users_count ?? 0) > 0
        const bloqueado = esAdminGlobal(rol)
        return (
          <div className="flex items-center justify-center gap-2">
            <Tooltip title="Editar">
              <button
                onClick={() => abrirEditar(rol)}
                className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50"
              >
                <FaEdit size={14} />
              </button>
            </Tooltip>

            {bloqueado ? (
              <Tooltip title="El administrador global no se puede eliminar">
                <span className="text-gray-300 p-1.5 cursor-not-allowed">
                  <FaTrash size={14} />
                </span>
              </Tooltip>
            ) : enUso ? (
              <Tooltip title="En uso por usuarios. Desactívalo en lugar de eliminar.">
                <span className="text-gray-300 p-1.5 cursor-not-allowed">
                  <FaTrash size={14} />
                </span>
              </Tooltip>
            ) : (
              <Popconfirm
                title="¿Eliminar este rol?"
                description="Esta acción no se puede deshacer"
                okText="Sí, eliminar"
                cancelText="Cancelar"
                onConfirm={() => eliminarMutation.mutate(rol.id)}
              >
                <Tooltip title="Eliminar">
                  <button className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50">
                    <FaTrash size={14} />
                  </button>
                </Tooltip>
              </Popconfirm>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <FaUserShield className="text-purple-600" />
          <span className="font-semibold">Roles del sistema</span>
          <Tag color="blue">{roles.length} total</Tag>
        </div>
        <Button type="primary" icon={<FaPlus />} onClick={abrirCrear}>
          Nuevo Rol
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin size="large" /></div>
      ) : (
        <Table
          rowKey="id"
          dataSource={roles}
          columns={columns}
          size="small"
          pagination={false}
          rowClassName={(rol) => (rol.estado === false ? 'opacity-60' : '')}
        />
      )}

      <Modal
        title={editando ? 'Editar Rol' : 'Nuevo Rol'}
        open={modalOpen}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        okText={editando ? 'Guardar' : 'Crear'}
        cancelText="Cancelar"
        confirmLoading={guardarMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => guardarMutation.mutate(values)}
          className="mt-4"
        >
          <Form.Item
            label="Nombre (clave interna)"
            name="name"
            rules={[{ required: true, message: 'El nombre es requerido' }]}
            extra="Ej: vendedor, almacenero, supervisor_ventas"
          >
            <Input placeholder="nombre_del_rol" />
          </Form.Item>
          <Form.Item
            label="Descripción"
            name="descripcion"
            rules={[{ required: true, message: 'La descripción es requerida' }]}
          >
            <Input placeholder="Descripción visible del rol" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
