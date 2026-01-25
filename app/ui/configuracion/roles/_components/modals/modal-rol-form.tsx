'use client'

import { Form, App, Input, Checkbox, Collapse, Badge } from 'antd'
import { useEffect } from 'react'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import LabelBase from '~/components/form/label-base'
import { permissionsApi, Role, Permission } from '~/lib/api/permissions'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface ModalRolFormProps {
  open: boolean
  setOpen: (open: boolean) => void
  role?: Role | null
  mode: 'create' | 'edit'
}

export default function ModalRolForm({
  open,
  setOpen,
  role,
  mode,
}: ModalRolFormProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  // Obtener todos los permisos
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await permissionsApi.getAll()
      return response.data || []
    },
  })

  // Obtener permisos del rol si estamos editando
  const { data: roleData } = useQuery({
    queryKey: ['role', role?.id],
    queryFn: async () => {
      if (!role?.id) return null
      const response = await permissionsApi.getRole(role.id)
      return response.data
    },
    enabled: mode === 'edit' && !!role?.id,
  })

  // Cargar datos del rol en el formulario
  useEffect(() => {
    if (mode === 'edit' && roleData) {
      form.setFieldsValue({
        name: roleData.name,
        descripcion: roleData.descripcion,
        permission_ids: roleData.permissions?.map(p => p.id) || [],
      })
    } else if (mode === 'create') {
      form.resetFields()
    }
  }, [mode, roleData, form])

  // Mutation para crear rol
  const createMutation = useMutation({
    mutationFn: async (values: { name: string; descripcion: string; permission_ids: number[] }) => {
      const response = await permissionsApi.createRole({
        name: values.name,
        descripcion: values.descripcion,
      })
      
      if (response.data && values.permission_ids.length > 0) {
        await permissionsApi.assignPermissionsToRole(response.data.id, values.permission_ids)
      }
      
      return response
    },
    onSuccess: () => {
      message.success('Rol creado correctamente')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al crear rol')
    },
  })

  // Mutation para actualizar rol
  const updateMutation = useMutation({
    mutationFn: async (values: { name: string; descripcion: string; permission_ids: number[] }) => {
      if (!role?.id) throw new Error('No role ID')
      
      await permissionsApi.updateRole(role.id, {
        name: values.name,
        descripcion: values.descripcion,
      })
      
      await permissionsApi.assignPermissionsToRole(role.id, values.permission_ids)
    },
    onSuccess: () => {
      message.success('Rol actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['role', role?.id] })
      setOpen(false)
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al actualizar rol')
    },
  })

  const handleSubmit = (values: any) => {
    if (mode === 'create') {
      createMutation.mutate(values)
    } else {
      updateMutation.mutate(values)
    }
  }

  // Agrupar permisos por módulo
  const groupedPermissions = permissionsData?.reduce((acc, permission) => {
    const parts = permission.name.split('.')
    const module = parts[0]
    if (!acc[module]) acc[module] = []
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  // Nombres amigables para módulos
  const moduleNames: Record<string, string> = {
    'gestion-comercial-e-inventario': '🏪 Gestión Comercial e Inventario',
    'facturacion-electronica': '📄 Facturación Electrónica',
    'gestion-contable-y-financiera': '💰 Gestión Contable y Financiera',
    'reportes': '📊 Reportes',
    'configuracion': '⚙️ Configuración',
    'producto': '📦 Productos',
    'venta': '🛒 Ventas',
    'compra': '🛍️ Compras',
    'cliente': '👥 Clientes',
    'proveedor': '🏢 Proveedores',
    'marca': '🏷️ Marcas',
    'categoria': '📑 Categorías',
    'almacen': '🏭 Almacenes',
    'ubicacion': '📍 Ubicaciones',
    'unidad-medida': '📏 Unidades de Medida',
    'unidad-derivada': '🔢 Unidades Derivadas',
    'ingreso-salida': '↔️ Ingresos y Salidas',
    'recepcion-almacen': '📥 Recepción de Almacén',
    'caja': '💵 Cajas',
    'cotizacion': '📝 Cotizaciones',
    'guia': '🚚 Guías de Remisión',
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm>
            {mode === 'create' ? 'Crear Nuevo Rol' : `Editar Rol: ${role?.name}`}
          </TitleForm>
        ),
        width: 900,
        centered: true,
        okText: mode === 'create' ? 'Crear Rol' : 'Guardar Cambios',
        confirmLoading: isPending,
      }}
      open={open}
      setOpen={setOpen}
      onCancel={() => {
        form.resetFields()
      }}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
    >
      <div className="space-y-4">
        {/* Información del Rol */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-bold mb-3">📋 Información del Rol</h3>
          
          <LabelBase label="*Nombre del Rol:" orientation="column">
            <Form.Item
              name="name"
              rules={[
                { required: true, message: 'El nombre es requerido' },
                { min: 3, message: 'Mínimo 3 caracteres' },
                { max: 50, message: 'Máximo 50 caracteres' },
                {
                  pattern: /^[a-z0-9_-]+$/,
                  message: 'Solo minúsculas, números, guiones y guiones bajos',
                },
              ]}
              noStyle
            >
              <Input
                placeholder="Ej: vendedor, almacenero, contador"
                disabled={mode === 'edit' && role?.name === 'admin_global'}
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="*Descripción:" orientation="column">
            <Form.Item
              name="descripcion"
              rules={[
                { required: true, message: 'La descripción es requerida' },
                { min: 5, message: 'Mínimo 5 caracteres' },
                { max: 255, message: 'Máximo 255 caracteres' },
              ]}
              noStyle
            >
              <Input placeholder="Ej: VENDEDOR, ALMACENERO, CONTADOR" />
            </Form.Item>
          </LabelBase>

          {mode === 'edit' && role?.name === 'admin_global' && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">
                ⚠️ El rol <strong>admin_global</strong> es especial y no se puede renombrar.
              </p>
            </div>
          )}
        </div>

        {/* Permisos */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold mb-3">🔐 Permisos del Rol</h3>
          
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              💡 Selecciona los permisos que tendrán los usuarios con este rol.
            </p>
          </div>

          <Form.Item name="permission_ids" valuePropName="value">
            <Checkbox.Group className="w-full">
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <Collapse
                  items={Object.entries(groupedPermissions || {}).map(([module, perms]) => ({
                    key: module,
                    label: (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold">
                          {moduleNames[module] || module}
                        </span>
                        <Badge count={perms.length} showZero style={{ backgroundColor: '#52c41a' }} />
                      </div>
                    ),
                    children: (
                      <div className="flex flex-col gap-2 pl-4">
                        {perms.map(permission => (
                          <Checkbox key={permission.id} value={permission.id}>
                            <div className="flex flex-col">
                              <span className="text-sm">{permission.descripcion}</span>
                              <span className="text-xs text-gray-400">{permission.name}</span>
                            </div>
                          </Checkbox>
                        ))}
                      </div>
                    ),
                  }))}
                />
              </div>
            </Checkbox.Group>
          </Form.Item>
        </div>
      </div>
    </ModalForm>
  )
}
