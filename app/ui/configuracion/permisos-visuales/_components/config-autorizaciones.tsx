'use client'

import { useState, useEffect } from 'react'
import { Switch, Select, message, Spin, Tag, Tooltip, Empty } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { autorizacionesApi, autorizacionesKeys, type AutorizacionConfig } from '~/lib/api/autorizaciones'
import { apiRequest } from '~/lib/api'
import { FaShieldAlt, FaUserShield } from 'react-icons/fa'

const ACCIONES = ['crear', 'editar', 'eliminar'] as const
type Accion = (typeof ACCIONES)[number]

const ACCION_COLORS: Record<Accion, string> = {
  crear: 'text-green-600',
  editar: 'text-blue-600',
  eliminar: 'text-red-600',
}

const ACCION_LABELS: Record<Accion, string> = {
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
}

const MODULOS = [
  { key: 'productos', label: 'Productos', icon: '📦' },
  { key: 'clientes', label: 'Clientes', icon: '👤' },
  { key: 'proveedores', label: 'Proveedores', icon: '🏢' },
  { key: 'ventas', label: 'Ventas', icon: '🛒' },
  { key: 'cotizaciones', label: 'Cotizaciones', icon: '💰' },
  { key: 'compras', label: 'Compras', icon: '📝' },
  { key: 'vales-compra', label: 'Vales de Compra', icon: '🎟️' },
  { key: 'prestamos', label: 'Préstamos', icon: '💸' },
  { key: 'guias', label: 'Guías', icon: '📄' },
  { key: 'entregas', label: 'Entregas', icon: '🚚' },
  { key: 'categorias', label: 'Categorías', icon: '📂' },
  { key: 'marcas', label: 'Marcas', icon: '🏷️' },
  { key: 'caja', label: 'Caja', icon: '🏦' },
]

interface ConfigAutorizacionesProps {
  roleId: number | null
  rolNombre: string
}

export default function ConfigAutorizaciones({ roleId, rolNombre }: ConfigAutorizacionesProps) {
  const queryClient = useQueryClient()

  // Cargar configs del rol
  const { data: configsResponse, isLoading } = useQuery({
    queryKey: autorizacionesKeys.configs(roleId ?? undefined),
    queryFn: () => autorizacionesApi.getConfigs(roleId!),
    enabled: !!roleId,
  })

  // Extraer configs - puede venir como array directo o envuelto en data
  const configs: AutorizacionConfig[] = (() => {
    const raw = configsResponse?.data
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as any).data)) return (raw as any).data
    return []
  })()

  // Cargar usuarios para selector de autorizador
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<any[]>('/autorizaciones/usuarios'),
  })

  const users: { id: string; name: string }[] = (() => {
    const raw = usersResponse?.data
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as any).data)) return (raw as any).data
    return []
  })()

  // Mutation para guardar config
  const saveMutation = useMutation({
    mutationFn: (data: {
      role_id: number
      modulo: string
      accion: Accion
      requiere_autorizacion: boolean
      autorizador_id?: string | null
    }) => autorizacionesApi.saveConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: autorizacionesKeys.configs(roleId ?? undefined) })
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al guardar configuración')
    },
  })

  // Helpers para obtener config actual
  const getConfig = (modulo: string, accion: Accion): AutorizacionConfig | undefined => {
    return configs.find(c => c.modulo === modulo && c.accion === accion)
  }

  const isRequiereAutorizacion = (modulo: string, accion: Accion): boolean => {
    const config = getConfig(modulo, accion)
    return config?.requiere_autorizacion ?? false
  }

  const getAutorizadorId = (modulo: string, accion: Accion): string | null => {
    const config = getConfig(modulo, accion)
    return config?.autorizador_id ?? null
  }

  // Toggle autorización
  const handleToggle = (modulo: string, accion: Accion, checked: boolean) => {
    if (!roleId) return
    saveMutation.mutate({
      role_id: roleId,
      modulo,
      accion,
      requiere_autorizacion: checked,
      autorizador_id: getAutorizadorId(modulo, accion),
    })
  }

  // Cambiar autorizador
  const handleAutorizadorChange = (modulo: string, accion: Accion, autorizadorId: string | null) => {
    if (!roleId) return
    saveMutation.mutate({
      role_id: roleId,
      modulo,
      accion,
      requiere_autorizacion: true,
      autorizador_id: autorizadorId,
    })
  }

  if (!roleId) {
    return (
      <div className='text-center text-gray-500 py-8'>
        Selecciona un rol para configurar autorizaciones
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Spin size='large' />
      </div>
    )
  }

  // Contar cuántas autorizaciones hay activas
  const totalActivas = configs.filter(c => c.requiere_autorizacion).length

  return (
    <div>
      <div className='flex items-center gap-3 mb-4'>
        <FaShieldAlt className='text-amber-500' size={20} />
        <div>
          <h3 className='text-base font-semibold m-0'>
            Autorizaciones por Acción
          </h3>
          <p className='text-sm text-gray-500 m-0'>
            Configura qué acciones del rol <strong className='text-blue-600'>{rolNombre}</strong> requieren aprobación de un superior.
          </p>
        </div>
        {totalActivas > 0 && (
          <Tag color='orange' className='ml-auto'>
            {totalActivas} {totalActivas === 1 ? 'restricción activa' : 'restricciones activas'}
          </Tag>
        )}
      </div>

      {/* Header de la tabla */}
      <div className='hidden sm:grid grid-cols-[1fr_repeat(3,120px)] gap-2 mb-2 px-3'>
        <div className='text-sm font-semibold text-gray-600'>Módulo</div>
        {ACCIONES.map(accion => (
          <div key={accion} className={`text-sm font-semibold text-center ${ACCION_COLORS[accion]}`}>
            {ACCION_LABELS[accion]}
          </div>
        ))}
      </div>

      {/* Filas de módulos */}
      <div className='space-y-1'>
        {MODULOS.map(modulo => (
          <div
            key={modulo.key}
            className='grid grid-cols-1 sm:grid-cols-[1fr_repeat(3,120px)] gap-2 items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors'
          >
            {/* Nombre del módulo */}
            <div className='flex items-center gap-2'>
              <span className='text-lg'>{modulo.icon}</span>
              <span className='font-medium text-sm'>{modulo.label}</span>
            </div>

            {/* Switches por acción */}
            {ACCIONES.map(accion => {
              const activo = isRequiereAutorizacion(modulo.key, accion)
              const autorizadorId = getAutorizadorId(modulo.key, accion)

              return (
                <div key={accion} className='flex flex-col items-center gap-1'>
                  {/* Label mobile */}
                  <span className={`sm:hidden text-xs font-medium ${ACCION_COLORS[accion]}`}>
                    {ACCION_LABELS[accion]}
                  </span>

                  <Switch
                    size='small'
                    checked={activo}
                    onChange={(checked) => handleToggle(modulo.key, accion, checked)}
                    loading={saveMutation.isPending}
                  />

                  {/* Selector de autorizador (solo si está activo) */}
                  {activo && (
                    <Select
                      size='small'
                      placeholder='Aprobador'
                      allowClear
                      className='w-full max-w-[110px]'
                      value={autorizadorId || undefined}
                      onChange={(val) => handleAutorizadorChange(modulo.key, accion, val || null)}
                      options={users.map(u => ({
                        label: u.name?.split(' ')[0] || u.name,
                        value: u.id,
                      }))}
                      popupMatchSelectWidth={200}
                      optionRender={(option) => {
                        const user = users.find(u => u.id === option.value)
                        return (
                          <div className='flex items-center gap-2'>
                            <FaUserShield className='text-blue-500' size={12} />
                            <span>{user?.name}</span>
                          </div>
                        )
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className='mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
        <p className='text-xs text-amber-700 m-0'>
          <strong>Nota:</strong> Si no se selecciona un aprobador específico, cualquier administrador podrá aprobar la solicitud.
          Las autorizaciones se guardan automáticamente al activar/desactivar cada switch.
        </p>
      </div>
    </div>
  )
}
