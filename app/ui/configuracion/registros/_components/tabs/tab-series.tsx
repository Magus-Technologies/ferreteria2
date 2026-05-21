'use client'

import { useState } from 'react'
import { App, Input, Modal, Select, Tag, Spin } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch, FaExclamationTriangle } from 'react-icons/fa'
import { serieDocumentoApi, type SerieDocumentoResponse } from '~/lib/api/serie-documento'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { almacenesApi } from '~/lib/api/almacen'
import ButtonBase from '~/components/buttons/button-base'

const TIPO_DOCUMENTO_OPCIONES = [
  { value: '01', label: 'Factura' },
  { value: '03', label: 'Boleta' },
  { value: '07', label: 'Nota de Crédito' },
  { value: '08', label: 'Nota de Débito' },
  { value: 'nv', label: 'Nota de Venta' },
  { value: 'in', label: 'Ingreso' },
  { value: 'sa', label: 'Salida' },
  { value: 'rc', label: 'Recibo' },
]

const extraColumns = [
  {
    key: 'tipo_documento',
    label: 'Tipo',
    render: (item: SerieDocumentoResponse) => {
      const opt = TIPO_DOCUMENTO_OPCIONES.find(t => t.value === item.tipo_documento)
      return <Tag color='blue'>{opt?.label || item.tipo_documento}</Tag>
    },
  },
  {
    key: 'correlativo',
    label: 'Correlativo',
    render: (item: SerieDocumentoResponse) => (
      <span className='font-mono text-sm'>{String(item.correlativo).padStart(8, '0')}</span>
    ),
  },
  {
    key: 'almacen',
    label: 'Almacén',
    render: (item: SerieDocumentoResponse) => (
      <span className='text-xs text-gray-500'>{item.almacen?.name || '-'}</span>
    ),
  },
]

const createFields = [
  { key: 'tipo_documento', label: 'Tipo de Documento', required: true },
  { key: 'serie', label: 'Serie', required: true },
  { key: 'correlativo', label: 'Correlativo inicial', required: false },
]

export default function TabSeries() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [creando, setCreando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevosExtras, setNuevosExtras] = useState<Record<string, string>>({})
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editandoNombre, setEditandoNombre] = useState('')

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SerieDocumentoResponse | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  const { data: series = [], isLoading } = useQuery({
    queryKey: [QueryKeys.SERIES_DOCUMENTOS, 'registros'],
    queryFn: async () => {
      const res = await serieDocumentoApi.list()
      return res.data?.data || []
    },
  })

  const { data: almacenes = [] } = useQuery({
    queryKey: [QueryKeys.ALMACENES],
    queryFn: async () => {
      const res = await almacenesApi.getAll(true)
      return res.data?.data || []
    },
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: [QueryKeys.SERIES_DOCUMENTOS] })
  }

  const crearMutation = useMutation({
    mutationFn: async () => {
      if (!nuevoNombre.trim()) throw new Error('El nombre es requerido')
      const data: any = { name: nuevoNombre.trim().toUpperCase() }
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
      if (!data.almacen_id && almacenes.length > 0) {
        data.almacen_id = almacenes[0].id
      }
      return serieDocumentoApi.create(data)
    },
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Serie creada')
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
      return serieDocumentoApi.update(editandoId, { serie: editandoNombre.trim().toUpperCase() })
    },
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Serie actualizada')
      setEditandoId(null)
      setEditandoNombre('')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => serieDocumentoApi.destroy(id),
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Serie eliminada')
      setDeleteConfirmOpen(false)
      setDeleteTarget(null)
      setDeleteInput('')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const toggleEstadoMutation = useMutation({
    mutationFn: async (item: SerieDocumentoResponse) => {
      return serieDocumentoApi.update(item.id, { activo: !item.activo })
    },
    onSuccess: (res: any) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Estado actualizado')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const openDeleteConfirm = (item: SerieDocumentoResponse) => {
    setDeleteTarget(item)
    setDeleteInput('')
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteInput !== deleteTarget.serie) {
      message.error('Serie no coincide. Intenta de nuevo.')
      return
    }
    eliminarMutation.mutate(deleteTarget.id)
  }

  const safeItems = Array.isArray(series) ? series : []
  const activos = safeItems.filter(i => i.activo !== false).length
  const inactivos = safeItems.filter(i => i.activo === false).length

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Tag color='blue'>{safeItems.length} total</Tag>
          <Tag color='green'>{activos} activas</Tag>
          {inactivos > 0 && <Tag color='red'>{inactivos} inactivas</Tag>}
        </div>
        <div className='flex items-center gap-2'>
          <ButtonBase
            color='success'
            size='md'
            onClick={() => setCreando(true)}
            className='flex items-center gap-1'
          >
            <FaPlus size={12} />
            Nueva Serie
          </ButtonBase>
        </div>
      </div>

      {creando && (
        <div className='flex gap-2 items-end p-4 bg-emerald-50 rounded-lg border border-emerald-200'>
          <div className='flex-1'>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Nombre</label>
            <Input
              placeholder={`Nombre de la serie...`}
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              onPressEnter={() => crearMutation.mutate()}
              autoFocus
            />
          </div>
          {createFields.map(field => (
            <div key={field.key} className='flex-1'>
              <label className='text-xs font-semibold text-gray-600 mb-1 block'>
                {field.label} {field.required && <span className='text-red-500'>*</span>}
              </label>
              {field.key === 'tipo_documento' ? (
                <Select
                  placeholder='Seleccionar tipo'
                  className='w-full'
                  value={nuevosExtras[field.key] || undefined}
                  onChange={val => setNuevosExtras(prev => ({ ...prev, [field.key]: val }))}
                  options={TIPO_DOCUMENTO_OPCIONES}
                />
              ) : field.key === 'correlativo' ? (
                <Input
                  type='number'
                  placeholder='0'
                  value={nuevosExtras[field.key] || ''}
                  onChange={e => setNuevosExtras(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : (
                <Input
                  placeholder={field.label}
                  value={nuevosExtras[field.key] || ''}
                  onChange={e => setNuevosExtras(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className='flex-1'>
            <label className='text-xs font-semibold text-gray-600 mb-1 block'>Almacén <span className='text-red-500'>*</span></label>
            <Select
              placeholder='Seleccionar almacén'
              className='w-full'
              value={nuevosExtras['almacen_id'] || undefined}
              onChange={val => setNuevosExtras(prev => ({ ...prev, ['almacen_id']: String(val) }))}
              options={almacenes.map((a: any) => ({ value: a.id, label: a.name }))}
            />
          </div>
          <ButtonBase
            color='success'
            size='md'
            onClick={() => crearMutation.mutate()}
            className='flex items-center gap-1'
            disabled={!nuevoNombre.trim() || !nuevosExtras['tipo_documento'] || !nuevosExtras['almacen_id']}
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

      {isLoading ? (
        <div className='flex justify-center py-12'><Spin size='large' /></div>
      ) : safeItems.length === 0 ? (
        <div className='text-center py-12 text-gray-400'>No hay series registradas</div>
      ) : (
        <div className='border rounded-lg overflow-hidden'>
          <div className='grid grid-cols-[1fr_100px_100px_120px_80px_100px] gap-4 px-4 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 uppercase'>
            <span>Nombre</span>
            <span className='text-center'>Tipo</span>
            <span className='text-center'>Correlativo</span>
            <span className='text-center'>Almacén</span>
            <span className='text-center'>Estado</span>
            <span className='text-center'>Acciones</span>
          </div>

          <div className='divide-y max-h-[60vh] overflow-y-auto'>
            {safeItems.map(item => {
              const nombre = item.serie || ''
              const isActivo = item.activo !== false
              const isEditing = editandoId === item.id
              const tipoOpt = TIPO_DOCUMENTO_OPCIONES.find(t => t.value === item.tipo_documento)

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_100px_100px_120px_80px_100px] gap-4 px-4 py-3 items-center transition-colors ${
                    !isActivo ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
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
                        {nombre}
                      </span>
                    )}
                  </div>

                  <div className='text-center'>
                    <Tag color='blue'>{tipoOpt?.label || item.tipo_documento}</Tag>
                  </div>

                  <div className='text-center'>
                    <span className='font-mono text-sm'>{String(item.correlativo).padStart(8, '0')}</span>
                  </div>

                  <div className='text-center'>
                    <span className='text-xs text-gray-500'>{item.almacen?.name || '-'}</span>
                  </div>

                  <div className='flex justify-center'>
                    <Tag color={isActivo ? 'green' : 'red'}>
                      {isActivo ? 'Activo' : 'Inactivo'}
                    </Tag>
                  </div>

                  <div className='flex justify-center gap-2'>
                    <button
                      onClick={() => { setEditandoId(item.id); setEditandoNombre(nombre) }}
                      className='text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50'
                      title='Editar'
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(item)}
                      className='text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50'
                      title='Eliminar'
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal
        title={
          <span className='flex items-center gap-2 text-red-600'>
            <FaExclamationTriangle />
            Confirmar eliminación
          </span>
        }
        open={deleteConfirmOpen}
        onCancel={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); setDeleteInput('') }}
        onOk={confirmDelete}
        okText='Eliminar'
        okButtonProps={{ danger: true, disabled: deleteInput !== deleteTarget?.serie }}
        cancelText='Cancelar'
        confirmLoading={eliminarMutation.isPending}
        width={450}
      >
        <div className='py-4'>
          <p className='text-sm text-gray-600 mb-4'>
            Para confirmar, escribe la <strong>serie</strong> que deseas eliminar:
          </p>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
            <p className='text-xs text-red-500 mb-2 font-semibold'>Serie a eliminar:</p>
            <p className='font-mono font-bold text-lg text-red-700'>{deleteTarget?.serie}</p>
          </div>
          <Input
            placeholder='Escribe la serie para confirmar'
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            onPressEnter={confirmDelete}
          />
          {deleteInput && deleteInput !== deleteTarget?.serie && (
            <p className='text-xs text-red-500 mt-1'>La serie no coincide</p>
          )}
        </div>
      </Modal>
    </div>
  )
}