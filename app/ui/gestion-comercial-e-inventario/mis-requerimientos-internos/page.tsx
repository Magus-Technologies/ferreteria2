'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Space, Tag, Input, Select, DatePicker, message, Tooltip, Empty, Spin } from 'antd'
import { SearchOutlined, PlusOutlined, FilePdfOutlined, EyeOutlined } from '@ant-design/icons'
import TableBase from '~/components/tables/table-base'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { requerimientoInternoApi, type RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import RequerimientoInternoPdf from '~/components/pdf/requerimiento-interno-pdf'
import ModalPdfViewer from '~/components/modals/modal-pdf-viewer'
import ModalDetalleRequerimiento from './_components/modal-detalle-requerimiento'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import dayjs from 'dayjs'

const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'blue',
  MEDIA: 'orange',
  ALTA: 'red',
  URGENTE: 'volcano',
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'processing',
  aprobado: 'success',
  rechazado: 'error',
  anulado: 'default',
}

export default function MisRequerimientosInternos() {
  const [requerimientos, setRequerimientos] = useState<RequerimientoInterno[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>()
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>()
  const [filtroPrioridad, setFiltroPrioridad] = useState<string | undefined>()
  const [pagination, setPagination] = useState({ page: 1, perPage: 20, total: 0 })
  const [modalOpen, setModalOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [requerimientoSeleccionado, setRequerimientoSeleccionado] = useState<RequerimientoInterno | null>(null)
  const { data: empresa } = useEmpresaPublica()

  useEffect(() => {
    fetchRequerimientos()
  }, [searchText, filtroEstado, filtroTipo, filtroPrioridad, pagination.page])

  const fetchRequerimientos = async () => {
    setLoading(true)
    try {
      const response = await requerimientoInternoApi.getAll({
        search: searchText,
        estado: filtroEstado,
        tipo_solicitud: filtroTipo,
        prioridad: filtroPrioridad,
        page: pagination.page,
        per_page: pagination.perPage,
      })

      if (response.data?.data) {
        setRequerimientos(response.data.data)
        setPagination(prev => ({
          ...prev,
          total: response.data?.total || 0,
        }))
      }
    } catch (error) {
      message.error('Error al cargar los requerimientos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const colDefs: ColDef[] = [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <span className="font-bold text-emerald-600">{data?.codigo}</span>
      ),
    },
    {
      headerName: 'Título',
      field: 'titulo',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="truncate">{data?.titulo}</div>
      ),
    },
    {
      headerName: 'Área',
      field: 'area',
      width: 130,
    },
    {
      headerName: 'Tipo',
      field: 'tipo_solicitud',
      width: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <Tag color={data?.tipo_solicitud === 'OC' ? 'blue' : 'green'}>
          {data?.tipo_solicitud === 'OC' ? 'Orden Compra' : 'Orden Servicio'}
        </Tag>
      ),
    },
    {
      headerName: 'Prioridad',
      field: 'prioridad',
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <Tag color={PRIORIDAD_COLORS[data?.prioridad || 'MEDIA']}>
          {data?.prioridad}
        </Tag>
      ),
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <Tag color={ESTADO_COLORS[data?.estado || 'pendiente']}>
          {data?.estado?.toUpperCase()}
        </Tag>
      ),
    },
    {
      headerName: 'Fecha Requerida',
      field: 'fecha_requerida',
      width: 130,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <span className="text-xs">
          {data?.fecha_requerida ? dayjs(data.fecha_requerida).format('DD/MM/YYYY') : '—'}
        </span>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'acciones',
      width: 150,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                if (data) {
                  setRequerimientoSeleccionado(data)
                  setModalOpen(true)
                }
              }}
              className="!text-emerald-600 hover:!text-emerald-700"
            />
          </Tooltip>
          <Tooltip title="Ver PDF">
            <Button
              type="text"
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => {
                if (data) {
                  setRequerimientoSeleccionado(data)
                  setPdfModalOpen(true)
                }
              }}
              className="!text-red-600 hover:!text-red-700"
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Requerimientos Internos</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona tus solicitudes de compra y servicios</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !rounded-lg"
        >
          Nuevo Requerimiento
        </Button>
      </div>

      <Card className="!rounded-2xl !border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Input
            placeholder="Buscar por código o título..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="!rounded-lg !border-slate-200"
          />
          <Select
            placeholder="Filtrar por estado"
            allowClear
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={[
              { label: 'Pendiente', value: 'pendiente' },
              { label: 'Aprobado', value: 'aprobado' },
              { label: 'Rechazado', value: 'rechazado' },
              { label: 'Anulado', value: 'anulado' },
            ]}
            className="!rounded-lg"
          />
          <Select
            placeholder="Filtrar por tipo"
            allowClear
            value={filtroTipo}
            onChange={setFiltroTipo}
            options={[
              { label: 'Orden de Compra', value: 'OC' },
              { label: 'Orden de Servicio', value: 'OS' },
            ]}
            className="!rounded-lg"
          />
          <Select
            placeholder="Filtrar por prioridad"
            allowClear
            value={filtroPrioridad}
            onChange={setFiltroPrioridad}
            options={[
              { label: 'Baja', value: 'BAJA' },
              { label: 'Media', value: 'MEDIA' },
              { label: 'Alta', value: 'ALTA' },
              { label: 'Urgente', value: 'URGENTE' },
            ]}
            className="!rounded-lg"
          />
          <Button
            onClick={() => {
              setSearchText('')
              setFiltroEstado(undefined)
              setFiltroTipo(undefined)
              setFiltroPrioridad(undefined)
            }}
            className="!rounded-lg"
          >
            Limpiar Filtros
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : requerimientos.length === 0 ? (
          <Empty
            description="No hay requerimientos"
            style={{ marginTop: 48, marginBottom: 48 }}
          />
        ) : (
          <div className="h-96">
            <TableBase
              rowData={requerimientos}
              columnDefs={colDefs}
              rowSelection={false}
              isVisible={true}
              pagination={true}
            />
          </div>
        )}
      </Card>

      <ModalDetalleRequerimiento
        open={modalOpen}
        requerimiento={requerimientoSeleccionado}
        onClose={() => {
          setModalOpen(false)
          setRequerimientoSeleccionado(null)
        }}
      />

      <ModalPdfViewer
        open={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false)
          setRequerimientoSeleccionado(null)
        }}
        document={
          requerimientoSeleccionado ? (
            <RequerimientoInternoPdf requerimiento={requerimientoSeleccionado} empresa={empresa} />
          ) : (
            <></>
          )
        }
        fileName={requerimientoSeleccionado ? `${requerimientoSeleccionado.codigo}-LOG-F-03` : 'documento'}
        title={requerimientoSeleccionado ? `PDF - ${requerimientoSeleccionado.codigo}` : 'PDF'}
      />
    </div>
  )
}
