'use client'

import { useMemo, useState } from 'react'
import {
  App,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Tag,
  Tooltip,
} from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import ButtonBase from '~/components/buttons/button-base'
import { blueColors } from '~/lib/colors'
import { cargosApi, type Cargo } from '~/lib/api/catalogos'
import { permissionsApi } from '~/lib/api/permissions'

const CARGOS_GESTION_KEY = ['cargos-gestion']

interface CargoFormValues {
  codigo: string
  descripcion: string
  parent?: string | null
  staff?: boolean
  highlight?: boolean
  role_id?: number | null
}

export default function TabCargos() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cargo | null>(null)
  const [form] = Form.useForm<CargoFormValues>()

  const { data: cargos = [], isLoading } = useQuery({
    queryKey: CARGOS_GESTION_KEY,
    queryFn: () => cargosApi.listGestion(),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-gestion', 'select'],
    queryFn: async () => {
      const res = await permissionsApi.getRolesGestion()
      return (res.data?.data ?? []).filter((r) => r.estado !== false)
    },
    staleTime: 5 * 60 * 1000,
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: CARGOS_GESTION_KEY })
    // refrescar también los catálogos que consumen cargos (organigrama / selects)
    queryClient.invalidateQueries({ queryKey: ['catalogos', 'cargos'] })
  }

  const guardarMutation = useMutation({
    mutationFn: async (values: CargoFormValues) => {
      const payload: Cargo = {
        codigo: values.codigo.trim().toUpperCase(),
        descripcion: values.descripcion.trim(),
        parent: values.parent || null,
        staff: !!values.staff,
        highlight: !!values.highlight,
        role_id: values.role_id ?? null,
      }
      if (editando) {
        return cargosApi.update(editando.codigo, payload)
      }
      return cargosApi.create(payload)
    },
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'Error al guardar el cargo')
        return
      }
      message.success(editando ? 'Cargo actualizado' : 'Cargo creado')
      cerrarModal()
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'Error al guardar el cargo'),
  })

  const eliminarMutation = useMutation({
    mutationFn: (codigo: string) => cargosApi.delete(codigo),
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'No se pudo eliminar')
        return
      }
      message.success('Cargo eliminado')
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'No se pudo eliminar'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ codigo, estado }: { codigo: string; estado: boolean }) =>
      cargosApi.toggleEstado(codigo, estado),
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

  const abrirEditar = (cargo: Cargo) => {
    setEditando(cargo)
    form.setFieldsValue({
      codigo: cargo.codigo,
      descripcion: cargo.descripcion,
      parent: cargo.parent || undefined,
      staff: !!cargo.staff,
      highlight: !!cargo.highlight,
      role_id: cargo.role_id ?? undefined,
    })
    setModalOpen(true)
  }

  const cerrarModal = () => {
    setModalOpen(false)
    setEditando(null)
    form.resetFields()
  }

  const descripcionPorCodigo = (codigo?: string | null) =>
    codigo ? cargos.find((c) => c.codigo === codigo)?.descripcion || codigo : '—'

  const columnDefs = useMemo<ColDef<Cargo>[]>(
    () => [
      {
        headerName: 'Estado',
        field: 'estado',
        width: 100,
        cellRenderer: (params: { data: Cargo }) => (
          <div className='flex items-center h-full'>
            <Switch
              size='small'
              checked={params.data.estado !== false}
              disabled={toggleMutation.isPending}
              onChange={(checked) => toggleMutation.mutate({ codigo: params.data.codigo, estado: checked })}
            />
          </div>
        ),
      },
      {
        headerName: 'Nombre del cargo (código)',
        field: 'codigo',
        width: 200,
        filter: 'agTextColumnFilter',
        valueGetter: (params) => params.data?.codigo || '-',
      },
      {
        headerName: 'Descripción',
        field: 'descripcion',
        flex: 1,
        minWidth: 200,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: { data: Cargo }) => {
          const c = params.data
          return (
            <span className={`font-medium ${c.estado === false ? 'text-gray-400 line-through' : ''}`}>
              {c.descripcion}
              {c.staff && <Tag color='purple' className='!ml-1 !text-[10px]'>staff</Tag>}
            </span>
          )
        },
      },
      {
        headerName: 'Reporta a (cargo superior)',
        field: 'parent',
        width: 200,
        valueGetter: (params) => descripcionPorCodigo(params.data?.parent),
      },
      {
        headerName: 'Rol relacionado (opcional)',
        field: 'role',
        width: 180,
        cellRenderer: (params: { data: Cargo }) =>
          params.data.role ? (
            <Tag color='purple'>{params.data.role.name}</Tag>
          ) : (
            <span className='text-gray-300 text-xs'>—</span>
          ),
      },
      {
        headerName: 'Usuarios',
        field: 'users_count',
        width: 110,
        cellRenderer: (params: { data: Cargo }) => {
          const n = params.data.users_count ?? 0
          return <Tag color={n > 0 ? 'blue' : 'default'}>{n}</Tag>
        },
      },
      {
        headerName: 'Acciones',
        width: 140,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: (params: { data: Cargo }) => {
          const c = params.data
          const enUso = (c.users_count ?? 0) > 0
          return (
            <div className='flex gap-2 items-center h-full'>
              <ButtonBase size='sm' color='warning' onClick={() => abrirEditar(c)}>
                <FaEdit />
              </ButtonBase>
              {enUso ? (
                <Tooltip title='En uso por usuarios. Desactívalo en lugar de eliminar.'>
                  <ButtonBase size='sm' color='danger' disabled>
                    <FaTrash />
                  </ButtonBase>
                </Tooltip>
              ) : (
                <Popconfirm
                  title='¿Eliminar este cargo?'
                  description='Esta acción no se puede deshacer'
                  okText='Sí, eliminar'
                  cancelText='Cancelar'
                  okButtonProps={{ danger: true }}
                  onConfirm={() => eliminarMutation.mutate(c.codigo)}
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
    [cargos, toggleMutation, eliminarMutation]
  )

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex justify-end'>
        <ButtonBase color='success' size='md' onClick={abrirCrear} className='flex items-center gap-2'>
          <FaPlus />
          Nuevo Cargo
        </ButtonBase>
      </div>

      <TableWithTitle
        id='configuracion-cargos'
        title='Cargos ocupacionales (organigrama)'
        extraTitle={<Tag color='blue'>{cargos.length} total</Tag>}
        rowData={cargos}
        columnDefs={columnDefs}
        loading={isLoading}
        domLayout='autoHeight'
        selectionColor={blueColors[0]}
        pagination={true}
        paginationPageSize={20}
        getRowId={(params) => params.data.codigo}
      />

      <Modal
        title={editando ? 'Editar Cargo' : 'Nuevo Cargo'}
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
            label='Nombre del cargo (código)'
            name='codigo'
            rules={[{ required: true, message: 'El código es requerido' }]}
            normalize={(v) => (typeof v === 'string' ? v.toUpperCase() : v)}
            extra='Ej: GERENTE COMERCIAL, ALMACENERO'
          >
            <Input placeholder='GERENTE COMERCIAL' />
          </Form.Item>
          <Form.Item
            label='Descripción'
            name='descripcion'
            rules={[{ required: true, message: 'La descripción es requerida' }]}
          >
            <Input placeholder='Descripción del cargo' />
          </Form.Item>
          <Form.Item label='Reporta a (cargo superior)' name='parent'>
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              placeholder='Sin superior (raíz)'
              options={cargos
                .filter((c) => c.codigo !== editando?.codigo)
                .map((c) => ({ value: c.codigo, label: c.descripcion }))}
            />
          </Form.Item>
          <Form.Item
            label='Rol relacionado (opcional)'
            name='role_id'
            extra='Relaciona este cargo con un rol del sistema (referencia).'
          >
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              placeholder='Sin rol relacionado'
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item name='staff' valuePropName='checked'>
            <Checkbox>Cargo staff (asesor, fuera de la línea jerárquica)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
