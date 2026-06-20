'use client'

import { useMemo, useState } from 'react'
import { App, Form, Input, Modal, Popconfirm, Switch, Tag, Tooltip } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import ButtonBase from '~/components/buttons/button-base'
import { blueColors } from '~/lib/colors'
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

  const columnDefs = useMemo<ColDef<Role>[]>(
    () => [
      {
        headerName: 'Estado',
        field: 'estado',
        width: 110,
        cellRenderer: (params: { data: Role }) => (
          <div className='flex items-center h-full'>
            <Switch
              size='small'
              checked={params.data.estado !== false}
              disabled={esAdminGlobal(params.data) || toggleMutation.isPending}
              onChange={(checked) => toggleMutation.mutate({ id: params.data.id, estado: checked })}
            />
          </div>
        ),
      },
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 1,
        minWidth: 180,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: { data: Role }) => (
          <span className={`font-medium ${params.data.estado === false ? 'text-gray-400 line-through' : ''}`}>
            {params.data.name}
          </span>
        ),
      },
      {
        headerName: 'Descripción',
        field: 'descripcion',
        flex: 1,
        minWidth: 200,
        filter: 'agTextColumnFilter',
        valueGetter: (params) => params.data?.descripcion || '-',
      },
      {
        headerName: 'Usuarios',
        field: 'users_count',
        width: 110,
        cellRenderer: (params: { data: Role }) => {
          const c = params.data.users_count ?? 0
          return <Tag color={c > 0 ? 'blue' : 'default'}>{c}</Tag>
        },
      },
      {
        headerName: 'Acciones',
        width: 140,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: (params: { data: Role }) => {
          const rol = params.data
          const enUso = (rol.users_count ?? 0) > 0
          const bloqueado = esAdminGlobal(rol)
          return (
            <div className='flex gap-2 items-center h-full'>
              <ButtonBase size='sm' color='warning' onClick={() => abrirEditar(rol)}>
                <FaEdit />
              </ButtonBase>
              {bloqueado ? (
                <Tooltip title='El administrador global no se puede eliminar'>
                  <ButtonBase size='sm' color='danger' disabled>
                    <FaTrash />
                  </ButtonBase>
                </Tooltip>
              ) : enUso ? (
                <Tooltip title='En uso por usuarios. Desactívalo en lugar de eliminar.'>
                  <ButtonBase size='sm' color='danger' disabled>
                    <FaTrash />
                  </ButtonBase>
                </Tooltip>
              ) : (
                <Popconfirm
                  title='¿Eliminar este rol?'
                  description='Esta acción no se puede deshacer'
                  okText='Sí, eliminar'
                  cancelText='Cancelar'
                  okButtonProps={{ danger: true }}
                  onConfirm={() => eliminarMutation.mutate(rol.id)}
                >
                  <ButtonBase size='sm' color='danger'>
                    <FaTrash />
                  </ButtonBase>
                </Popconfirm>
              )}
            </div>
          )
        },
      },
    ],
    [toggleMutation, eliminarMutation]
  )

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex justify-end'>
        <ButtonBase color='success' size='md' onClick={abrirCrear} className='flex items-center gap-2'>
          <FaPlus />
          Nuevo Rol
        </ButtonBase>
      </div>

      <TableWithTitle
        id='configuracion-roles'
        title='Roles del sistema'
        extraTitle={<Tag color='blue'>{roles.length} total</Tag>}
        rowData={roles}
        columnDefs={columnDefs}
        loading={isLoading}
        domLayout='autoHeight'
        selectionColor={blueColors[0]}
        pagination={true}
        paginationPageSize={20}
        getRowId={(params) => String(params.data.id)}
      />

      <Modal
        title={editando ? 'Editar Rol' : 'Nuevo Rol'}
        open={modalOpen}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        okText={editando ? 'Guardar' : 'Crear'}
        cancelText='Cancelar'
        confirmLoading={guardarMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={(values) => guardarMutation.mutate(values)}
          className='mt-4'
        >
          <Form.Item
            label='Nombre (clave interna)'
            name='name'
            rules={[{ required: true, message: 'El nombre es requerido' }]}
            extra='Ej: vendedor, almacenero, supervisor_ventas'
          >
            <Input placeholder='nombre_del_rol' />
          </Form.Item>
          <Form.Item
            label='Descripción'
            name='descripcion'
            rules={[{ required: true, message: 'La descripción es requerida' }]}
          >
            <Input placeholder='Descripción visible del rol' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
