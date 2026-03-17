'use client'

import { App, Input, Popconfirm, Switch, Tag, Empty, Spin } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'

export interface CatalogoItem {
  id: number
  name?: string
  nombre?: string
  estado?: boolean
  activo?: boolean
  [key: string]: any
}

interface TablaCatalogoProps<T extends CatalogoItem> {
  queryKey: string | string[]
  fetchFn: () => Promise<T[]>
  createFn: (data: any) => Promise<any>
  updateFn: (id: number, data: any) => Promise<any>
  deleteFn: (id: number) => Promise<any>
  nameField?: 'name' | 'nombre'
  statusField?: 'estado' | 'activo'
  extraColumns?: { key: string; label: string; render?: (item: T) => React.ReactNode }[]
  createFields?: { key: string; label: string; required?: boolean }[]
  entityName: string
}

export default function TablaCatalogo<T extends CatalogoItem>({
  queryKey,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  nameField = 'name',
  statusField = 'estado',
  extraColumns = [],
  createFields,
  entityName,
}: TablaCatalogoProps<T>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [busqueda, setBusqueda] = useState('')
  const [creando, setCreando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevosExtras, setNuevosExtras] = useState<Record<string, string>>({})
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editandoNombre, setEditandoNombre] = useState('')

  const qk = Array.isArray(queryKey) ? queryKey : [queryKey]

  const { data: items, isLoading } = useQuery({
    queryKey: [...qk, 'registros'],
    queryFn: fetchFn,
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: qk })
  }

  const filteredItems = useMemo(() => {
    const arr = Array.isArray(items) ? items : []
    if (!busqueda.trim()) return arr
    const term = busqueda.toLowerCase()
    return arr.filter(item => {
      const nombre = (item[nameField] || '').toString().toLowerCase()
      return nombre.includes(term)
    })
  }, [items, busqueda, nameField])

  const crearMutation = useMutation({
    mutationFn: async () => {
      if (!nuevoNombre.trim()) throw new Error('El nombre es requerido')
      const data: any = { [nameField]: nuevoNombre.trim().toUpperCase() }
      if (createFields) {
        for (const field of createFields) {
          if (field.required && !nuevosExtras[field.key]?.trim()) {
            throw new Error(`${field.label} es requerido`)
          }
          if (nuevosExtras[field.key]?.trim()) {
            data[field.key] = nuevosExtras[field.key].trim()
          }
        }
      }
      return createFn(data)
    },
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success(`${entityName} creado`)
      setNuevoNombre('')
      setNuevosExtras({})
      setCreando(false)
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const editarMutation = useMutation({
    mutationFn: async () => {
      if (!editandoId || !editandoNombre.trim()) throw new Error('Datos incompletos')
      return updateFn(editandoId, { [nameField]: editandoNombre.trim().toUpperCase() })
    },
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success(`${entityName} actualizado`)
      setEditandoId(null)
      setEditandoNombre('')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const eliminarMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success(`${entityName} eliminado`)
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const toggleEstadoMutation = useMutation({
    mutationFn: async (item: T) => {
      const currentStatus = item[statusField]
      return updateFn(item.id, { [statusField]: !currentStatus })
    },
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Estado actualizado')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const safeItems = Array.isArray(items) ? items : []
  const activos = safeItems.filter(i => i[statusField] !== false).length
  const inactivos = safeItems.filter(i => i[statusField] === false).length

  return (
    <div className='space-y-4'>
      {/* Header con stats y acciones */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Tag color='blue'>{items?.length || 0} total</Tag>
          <Tag color='green'>{activos} activos</Tag>
          {inactivos > 0 && <Tag color='red'>{inactivos} inactivos</Tag>}
        </div>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Buscar...'
            prefix={<FaSearch className='text-gray-400' size={12} />}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className='w-[250px]'
            allowClear
          />
          <ButtonBase
            color='success'
            size='md'
            onClick={() => setCreando(true)}
            className='flex items-center gap-1'
          >
            <FaPlus size={12} />
            Nuevo
          </ButtonBase>
        </div>
      </div>

      {/* Formulario crear */}
      {creando && (
        <div className='flex gap-2 items-end p-4 bg-emerald-50 rounded-lg border border-emerald-200'>
          <div className='flex-1'>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Nombre</label>
            <Input
              placeholder={`Nombre del ${entityName.toLowerCase()}...`}
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              onPressEnter={() => crearMutation.mutate()}
              autoFocus
            />
          </div>
          {createFields?.map(field => (
            <div key={field.key} className='flex-1'>
              <label className='text-xs font-semibold text-gray-600 mb-1 block'>
                {field.label} {field.required && <span className='text-red-500'>*</span>}
              </label>
              <Input
                placeholder={field.label}
                value={nuevosExtras[field.key] || ''}
                onChange={e => setNuevosExtras(prev => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <ButtonBase
            color='success'
            size='md'
            onClick={() => crearMutation.mutate()}
            className='flex items-center gap-1'
            disabled={!nuevoNombre.trim()}
          >
            <FaCheck size={12} />
            Crear
          </ButtonBase>
          <ButtonBase
            color='default'
            size='md'
            onClick={() => { setCreando(false); setNuevoNombre(''); setNuevosExtras({}) }}
            className='flex items-center gap-1'
          >
            <FaTimes size={12} />
          </ButtonBase>
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className='flex justify-center py-12'><Spin size='large' /></div>
      ) : filteredItems.length === 0 ? (
        <Empty description={busqueda ? 'Sin resultados' : `No hay ${entityName.toLowerCase()}s`} />
      ) : (
        <div className='border rounded-lg overflow-hidden'>
          {/* Header de tabla */}
          <div className='grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 uppercase'>
            <span>Nombre</span>
            {extraColumns.map(col => (
              <span key={col.key} className='w-[120px] text-center'>{col.label}</span>
            ))}
            <span className='w-[80px] text-center'>Estado</span>
            <span className='w-[100px] text-center'>Acciones</span>
          </div>

          {/* Filas */}
          <div className='divide-y max-h-[60vh] overflow-y-auto'>
            {filteredItems.map(item => {
              const nombre = item[nameField] || ''
              const isActivo = item[statusField] !== false
              const isEditing = editandoId === item.id

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 items-center transition-colors ${
                    !isActivo ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Nombre */}
                  <div>
                    {isEditing ? (
                      <div className='flex items-center gap-2'>
                        <Input
                          value={editandoNombre}
                          onChange={e => setEditandoNombre(e.target.value)}
                          onPressEnter={() => editarMutation.mutate()}
                          size='small'
                          autoFocus
                        />
                        <button onClick={() => editarMutation.mutate()} className='text-emerald-600 hover:text-emerald-800 p-1'>
                          <FaCheck size={13} />
                        </button>
                        <button onClick={() => { setEditandoId(null); setEditandoNombre('') }} className='text-gray-400 hover:text-gray-600 p-1'>
                          <FaTimes size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-medium text-sm ${!isActivo ? 'text-gray-400 line-through' : ''}`}>
                        {nombre as string}
                      </span>
                    )}
                  </div>

                  {/* Extra columns */}
                  {extraColumns.map(col => (
                    <div key={col.key} className='w-[120px] text-center text-sm'>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </div>
                  ))}

                  {/* Estado */}
                  <div className='w-[80px] flex justify-center'>
                    <Switch
                      size='small'
                      checked={isActivo}
                      onChange={() => toggleEstadoMutation.mutate(item)}
                      loading={toggleEstadoMutation.isPending}
                    />
                  </div>

                  {/* Acciones */}
                  <div className='w-[100px] flex justify-center gap-2'>
                    <button
                      onClick={() => { setEditandoId(item.id); setEditandoNombre(nombre as string) }}
                      className='text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50'
                      title='Editar'
                    >
                      <FaEdit size={14} />
                    </button>
                    <Popconfirm
                      title={`¿Eliminar este ${entityName.toLowerCase()}?`}
                      description='Esta acción no se puede deshacer'
                      onConfirm={() => eliminarMutation.mutate(item.id)}
                      okText='Sí, eliminar'
                      cancelText='Cancelar'
                    >
                      <button className='text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50' title='Eliminar'>
                        <FaTrash size={14} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
