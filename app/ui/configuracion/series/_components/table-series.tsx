'use client'

import { useState, useMemo, useCallback } from 'react'
import { App, Input, Modal, Select, Tag, Spin, Switch, Button, message, Popconfirm, InputNumber } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch, FaFileInvoice, FaExclamationTriangle } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { serieDocumentoApi, type SerieDocumentoResponse } from '~/lib/api/serie-documento'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import {blueColors} from '~/lib/colors'

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

interface FormState {
  tipo_documento: string
  serie: string
  correlativo: number
  almacen_id: number | null
  activo: boolean
}

const initialFormState: FormState = {
  tipo_documento: '',
  serie: '',
  correlativo: 0,
  almacen_id: null,
  activo: true,
}

export default function TableSeries() {
  const { message: antdMessage } = App.useApp()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(initialFormState)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SerieDocumentoResponse | null>(null)
  const [deleteInput, setDeleteInput] = useState('')
  const [serieError, setSerieError] = useState('')

  const { data: series = [], isLoading } = useQuery({
    queryKey: [QueryKeys.SERIES_DOCUMENTOS],
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

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return series
    const term = searchText.toLowerCase()
    return series.filter(s =>
      s.serie.toLowerCase().includes(term) ||
      s.tipo_documento.includes(term) ||
      s.almacen?.name?.toLowerCase().includes(term)
    )
  }, [series, searchText])

  const openCreateModal = () => {
    setForm(initialFormState)
    setEditId(null)
    setSerieError('')
    setIsModalOpen(true)
  }

  const openEditModal = (record: SerieDocumentoResponse) => {
    setForm({
      tipo_documento: record.tipo_documento,
      serie: record.serie,
      correlativo: record.correlativo,
      almacen_id: record.almacen_id,
      activo: record.activo,
    })
    setEditId(record.id)
    setSerieError('')
    setIsModalOpen(true)
  }

  const handleSerieChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    setForm(prev => ({ ...prev, serie: upper }))
    if (upper.length !== 4) {
      setSerieError('La serie debe tener exactamente 4 caracteres (letras y números)')
    } else {
      setSerieError('')
    }
  }

  const crearMutation = useMutation({
    mutationFn: (data: FormState) => serieDocumentoApi.create({
      tipo_documento: data.tipo_documento,
      serie: data.serie,
      correlativo: data.correlativo || 0,
      almacen_id: data.almacen_id!,
      activo: data.activo,
    }),
    onSuccess: (res: any) => {
      if (res.error) { antdMessage.error(res.error.message); return }
      antdMessage.success('Serie creada correctamente')
      setIsModalOpen(false)
      setForm(initialFormState)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERIES_DOCUMENTOS] })
    },
    onError: (e: any) => antdMessage.error(e.message),
  })

  const editarMutation = useMutation({
    mutationFn: (data: FormState) => serieDocumentoApi.update(editId!, {
      tipo_documento: data.tipo_documento,
      serie: data.serie,
      correlativo: data.correlativo,
      almacen_id: data.almacen_id!,
      activo: data.activo,
    }),
    onSuccess: (res: any) => {
      if (res.error) { antdMessage.error(res.error.message); return }
      antdMessage.success('Serie actualizada correctamente')
      setIsModalOpen(false)
      setEditId(null)
      setForm(initialFormState)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERIES_DOCUMENTOS] })
    },
    onError: (e: any) => antdMessage.error(e.message),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => serieDocumentoApi.destroy(id),
    onSuccess: (res: any) => {
      if (res.error) { antdMessage.error(res.error.message); return }
      antdMessage.success('Serie eliminada')
      setDeleteConfirmOpen(false)
      setDeleteTarget(null)
      setDeleteInput('')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERIES_DOCUMENTOS] })
    },
    onError: (e: any) => antdMessage.error(e.message),
  })

  const toggleEstadoMutation = useMutation({
    mutationFn: (record: SerieDocumentoResponse) =>
      serieDocumentoApi.update(record.id, { activo: !record.activo }),
    onSuccess: (res: any) => {
      if (res.error) { antdMessage.error(res.error.message); return }
      antdMessage.success('Estado actualizado')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERIES_DOCUMENTOS] })
    },
    onError: (e: any) => antdMessage.error(e.message),
  })

  const openDeleteConfirm = (record: SerieDocumentoResponse) => {
    setDeleteTarget(record)
    setDeleteInput('')
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteInput !== deleteTarget.serie) {
      antdMessage.error('La serie no coincide. Intenta de nuevo.')
      return
    }
    eliminarMutation.mutate(deleteTarget.id)
  }

  const handleSubmit = () => {
    if (!form.tipo_documento) { antdMessage.error('Selecciona el tipo de documento'); return }
    if (!form.serie || form.serie.length !== 4) { antdMessage.error('La serie debe tener 4 caracteres'); return }
    if (!form.almacen_id) { antdMessage.error('Selecciona un almacén'); return }

    if (editId) {
      editarMutation.mutate(form)
    } else {
      crearMutation.mutate(form)
    }
  }

  const columnDefs = useMemo((): any[] => [
    {
      headerName: 'Serie',
      field: 'serie',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: { data: SerieDocumentoResponse }) => (
        <span className='font-mono font-bold text-blue-700'>{params.data.serie}</span>
      ),
    },
    {
      headerName: 'Tipo',
      field: 'tipo_documento',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: { data: SerieDocumentoResponse }) => {
        const opt = TIPO_DOCUMENTO_OPCIONES.find(t => t.value === params.data.tipo_documento)
        return <Tag color='blue'>{opt?.label || params.data.tipo_documento}</Tag>
      },
    },
    {
      headerName: 'Correlativo',
      field: 'correlativo',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: { data: SerieDocumentoResponse }) => (
        <span className='font-mono text-gray-600'>{String(params.data.correlativo).padStart(8, '0')}</span>
      ),
    },
    {
      headerName: 'Siguiente',
      field: 'correlativo',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: { data: SerieDocumentoResponse }) => (
        <Tag color='green' className='font-mono'>{String(params.data.correlativo + 1).padStart(8, '0')}</Tag>
      ),
    },
    {
      headerName: 'Almacén',
      field: 'almacen.name',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: { data: SerieDocumentoResponse }) => (
        <span className='text-sm text-gray-500'>{params.data.almacen?.name || '-'}</span>
      ),
    },
    {
      headerName: 'Estado',
      field: 'activo',
      flex: 0,
      minWidth: 100,
      cellRenderer: (params: { data: SerieDocumentoResponse }) => (
        <Switch
          size='small'
          checked={params.data.activo}
          onChange={() => toggleEstadoMutation.mutate(params.data)}
          checkedChildren='ON'
          unCheckedChildren='OFF'
        />
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      flex: 0,
      minWidth: 120,
      cellRenderer: (params: { data: SerieDocumentoResponse }) => (
        <div className='flex items-center gap-2'>
          <button
            onClick={() => openEditModal(params.data)}
            className='text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50'
            title='Editar'
          >
            <FaEdit size={14} />
          </button>
          <Popconfirm
            title='¿Eliminar esta serie?'
            description='Esta acción no se puede deshacer'
            onConfirm={() => openDeleteConfirm(params.data)}
            okText='Sí, eliminar'
            cancelText='Cancelar'
          >
            <button className='text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50' title='Eliminar'>
              <FaTrash size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ], [])

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Series de Documentos</h1>
          <p className='text-sm text-gray-500 mt-1'>Configura las series para Facturas, Boletas, Notas y más</p>
        </div>
        <ButtonBase color='success' size='md' onClick={openCreateModal} className='flex items-center gap-2'>
          <FaPlus size={14} />
          Nueva Serie
        </ButtonBase>
      </div>

      <div className='bg-white rounded-lg border p-4'>
        <div className='flex items-center gap-3 mb-4'>
          <Input
            placeholder='Buscar por serie, tipo o almacén...'
            prefix={<FaSearch className='text-gray-400' />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className='w-[300px]'
            allowClear
          />
          <div className='flex items-center gap-2 ml-auto'>
            <Tag color='blue'>{series.length} series</Tag>
            <Tag color='green'>{series.filter(s => s.activo).length} activas</Tag>
            <Tag color='red'>{series.filter(s => !s.activo).length} inactivas</Tag>
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-12'><Spin size='large' /></div>
        ) : (
          <div className='ag-theme-custom' style={{ height: 'calc(100vh - 280px)', width: '100%' }}>
            <TableWithTitle
              id='series-table'
              title=''
              columnDefs={columnDefs}
              rowData={filteredData}
              withNumberColumn
              tableKey='series-documentos'
              selectionColor={blueColors[1]}
              isVisible={isModalOpen}
              onRowDoubleClicked={(e) => { if (e.data) openEditModal(e.data) }}
            />
          </div>
        )}
      </div>

      <Modal
        title={editId ? 'Editar Serie' : 'Nueva Serie'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditId(null); setForm(initialFormState); setSerieError('') }}
        onOk={handleSubmit}
        okText={editId ? 'Actualizar' : 'Crear'}
        cancelText='Cancelar'
        confirmLoading={crearMutation.isPending || editarMutation.isPending}
        width={480}
      >
        <div className='flex flex-col gap-4 py-4'>
          <div>
            <LabelBase label='Tipo de Documento *'>
              <Select
                placeholder='Seleccionar tipo'
                className='w-full'
                value={form.tipo_documento || undefined}
                onChange={val => setForm(prev => ({ ...prev, tipo_documento: val }))}
                options={TIPO_DOCUMENTO_OPCIONES}
              />
            </LabelBase>
          </div>

          <div>
            <LabelBase label='Serie *'>
              <Input
                placeholder='Ej: F001'
                maxLength={4}
                value={form.serie}
                onChange={e => handleSerieChange(e.target.value)} 
                className={`font-mono uppercase ${serieError ? 'border-red-500' : ''}`}
              />
              {serieError ? (
                <span className='text-xs text-red-500 mt-1'>{serieError}</span>
              ) : (
                <span className='text-xs text-gray-400 mt-1'>4 caracteres alfanuméricos en mayúscula</span>
              )}
            </LabelBase>
          </div>

          <div>
            <LabelBase label='Correlativo inicial'>
              <InputNumber
                min={0}
                className='w-full'
                value={form.correlativo}
                onChange={val => setForm(prev => ({ ...prev, correlativo: val || 0 }))}
                placeholder='0'
              />
              <span className='text-xs text-gray-400 mt-1'>Se recomienda dejar en 0 al crear</span>
            </LabelBase>
          </div>

          <div>
            <LabelBase label='Almacén *'>
              <Select
                placeholder='Seleccionar almacén'
                className='w-full'
                value={form.almacen_id || undefined}
                onChange={val => setForm(prev => ({ ...prev, almacen_id: val }))}
                options={almacenes.map((a: any) => ({ value: a.id, label: a.name }))}
              />
            </LabelBase>
          </div>

          {editId && (
            <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm text-gray-600'>Activo:</span>
              <Switch
                checked={form.activo}
                onChange={val => setForm(prev => ({ ...prev, activo: val }))}
                checkedChildren='ON'
                unCheckedChildren='OFF'
              />
            </div>
          )}
        </div>
      </Modal>

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
            Escribe la <strong>serie</strong> para confirmar la eliminación:
          </p>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
            <p className='text-xs text-red-500 mb-1 font-semibold'>Serie a eliminar:</p>
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