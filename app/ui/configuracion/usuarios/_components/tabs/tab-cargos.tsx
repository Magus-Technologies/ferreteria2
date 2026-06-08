'use client'

import { useState } from 'react'
import {
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash, FaSitemap } from 'react-icons/fa'
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
    codigo ? cargos.find(c => c.codigo === codigo)?.descripcion || codigo : '—'

  const columns = [
    {
      title: 'Cargo',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (d: string, c: Cargo) => (
        <span className={`font-medium ${c.estado === false ? 'text-gray-400 line-through' : ''}`}>
          {d} {c.staff && <Tag color="purple" className="!ml-1 !text-[10px]">staff</Tag>}
        </span>
      ),
    },
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (c: string) => <span className="text-xs text-gray-500">{c}</span>,
    },
    {
      title: 'Reporta a',
      dataIndex: 'parent',
      key: 'parent',
      render: (p: string | null) => <span className="text-sm text-gray-600">{descripcionPorCodigo(p)}</span>,
    },
    {
      title: 'Rol',
      key: 'role',
      render: (_: unknown, c: Cargo) =>
        c.role ? <Tag color="purple">{c.role.name}</Tag> : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      title: 'Usuarios',
      dataIndex: 'users_count',
      key: 'users_count',
      width: 90,
      align: 'center' as const,
      render: (n: number = 0) => <Tag color={n > 0 ? 'blue' : 'default'}>{n}</Tag>,
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, c: Cargo) => (
        <Switch
          size="small"
          checked={c.estado !== false}
          disabled={toggleMutation.isPending}
          onChange={(checked) => toggleMutation.mutate({ codigo: c.codigo, estado: checked })}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, c: Cargo) => {
        const enUso = (c.users_count ?? 0) > 0
        return (
          <div className="flex items-center justify-center gap-2">
            <Tooltip title="Editar">
              <button
                onClick={() => abrirEditar(c)}
                className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50"
              >
                <FaEdit size={14} />
              </button>
            </Tooltip>
            {enUso ? (
              <Tooltip title="En uso por usuarios. Desactívalo en lugar de eliminar.">
                <span className="text-gray-300 p-1.5 cursor-not-allowed">
                  <FaTrash size={14} />
                </span>
              </Tooltip>
            ) : (
              <Popconfirm
                title="¿Eliminar este cargo?"
                description="Esta acción no se puede deshacer"
                okText="Sí, eliminar"
                cancelText="Cancelar"
                onConfirm={() => eliminarMutation.mutate(c.codigo)}
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
          <FaSitemap className="text-yellow-600" />
          <span className="font-semibold">Cargos ocupacionales (organigrama)</span>
          <Tag color="blue">{cargos.length} total</Tag>
        </div>
        <Button type="primary" icon={<FaPlus />} onClick={abrirCrear}>
          Nuevo Cargo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin size="large" /></div>
      ) : (
        <Table
          rowKey="codigo"
          dataSource={cargos}
          columns={columns}
          size="small"
          pagination={false}
          rowClassName={(c) => (c.estado === false ? 'opacity-60' : '')}
        />
      )}

      <Modal
        title={editando ? 'Editar Cargo' : 'Nuevo Cargo'}
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
            label="Nombre del cargo (código)"
            name="codigo"
            rules={[{ required: true, message: 'El código es requerido' }]}
            normalize={(v) => (typeof v === 'string' ? v.toUpperCase() : v)}
            extra="Ej: GERENTE COMERCIAL, ALMACENERO"
          >
            <Input placeholder="GERENTE COMERCIAL" />
          </Form.Item>
          <Form.Item
            label="Descripción"
            name="descripcion"
            rules={[{ required: true, message: 'La descripción es requerida' }]}
          >
            <Input placeholder="Descripción del cargo" />
          </Form.Item>
          <Form.Item label="Reporta a (cargo superior)" name="parent">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sin superior (raíz)"
              options={cargos
                .filter((c) => c.codigo !== editando?.codigo)
                .map((c) => ({ value: c.codigo, label: c.descripcion }))}
            />
          </Form.Item>
          <Form.Item
            label="Rol relacionado (opcional)"
            name="role_id"
            extra="Relaciona este cargo con un rol del sistema (referencia)."
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sin rol relacionado"
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item name="staff" valuePropName="checked">
            <Checkbox>Cargo staff (asesor, fuera de la línea jerárquica)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
