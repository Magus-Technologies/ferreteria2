'use client'

import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { Spin, App, Tag } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { ColDef, ICellRendererParams, RowSelectedEvent } from 'ag-grid-community'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import ModalPdfViewer from '~/components/modals/modal-pdf-viewer'
import RequerimientoInternoPdf from '~/components/pdf/requerimiento-interno-pdf'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { type RequerimientoInterno, type RequerimientoInternoServicio, requerimientoInternoApi } from '~/lib/api/requerimiento-interno'
import { useStoreFiltrosMisOS } from './_store/store-filtros-mis-os'
import { useColumnsMisOS } from './_components/tables/columns-mis-os'
import ModalRequerimientoInterno from '../_components/modals/modal-requerimiento-interno'
import TableWithTitle from '~/components/tables/table-with-title'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

const FiltersMisOS = lazy(() => import('./_components/filters/filters-mis-os'))
const TableMisOS = lazy(() => import('./_components/tables/table-mis-os'))
const ModalDetalleRequerimiento = lazy(() => import('../mis-requerimientos-internos/_components/modal-detalle-requerimiento'))

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisOrdenesDeServicio() {
  const { modal, message } = App.useApp()
  const queryClient = useQueryClient()
  const filtros = useStoreFiltrosMisOS(state => state.filtros)
  const { data: empresa } = useEmpresaPublica()

  const [seleccionado, setSeleccionado] = useState<RequerimientoInterno | null>(null)
  const [filaSeleccionada, setFilaSeleccionada] = useState<RequerimientoInterno | null>(null)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  const handleView = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setModalDetalleOpen(true)
  }, [])

  const handleViewPdf = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setPdfModalOpen(true)
  }, [])

  const handleAprobar = useCallback((row: RequerimientoInterno) => {
    modal.confirm({
      title: '¿Aprobar Orden de Servicio?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p>¿Estás seguro de aprobar <strong>{row.codigo}</strong>?</p>
          <p className='text-sm text-slate-500 mt-1'>{row.titulo}</p>
          {row.servicio?.tipo_servicio && (
            <p className='text-sm text-slate-500'>Servicio: {row.servicio.tipo_servicio}</p>
          )}
        </div>
      ),
      okText: 'Sí, Aprobar',
      okType: 'primary',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await requerimientoInternoApi.updateEstado(row.id, { estado: 'aprobado' })
          message.success(`${row.codigo} aprobado correctamente`)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
        } catch (error) {
          message.error('Error al aprobar la orden de servicio')
          console.error(error)
        }
      },
    })
  }, [modal, message, queryClient])

  const columns = useColumnsMisOS({ onView: handleView, onViewPdf: handleViewPdf, onAprobar: handleAprobar })

  const servicioRowData = useMemo<RequerimientoInternoServicio[]>(() => {
    if (filaSeleccionada?.servicio) return [filaSeleccionada.servicio]
    return []
  }, [filaSeleccionada])

  const columnsDetalle = useMemo<ColDef<RequerimientoInternoServicio>[]>(() => [
    {
      headerName: 'Tipo Servicio',
      field: 'tipo_servicio',
      width: 150,
      minWidth: 120,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoServicio>) => (
        <div className="flex items-center h-full">
          <Tag color="green" className="!rounded-md !font-semibold">{data?.tipo_servicio || '—'}</Tag>
        </div>
      ),
    },
    {
      headerName: 'Descripción',
      field: 'descripcion_servicio',
      flex: 1,
      minWidth: 250,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoServicio>) => (
        <div className="flex items-center h-full text-slate-600 text-xs overflow-hidden text-ellipsis whitespace-nowrap">
          {data?.descripcion_servicio || '—'}
        </div>
      ),
    },
    {
      headerName: 'Lugar de Ejecución',
      field: 'lugar_ejecucion',
      width: 170,
      minWidth: 130,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoServicio>) => (
        <div className="flex items-center h-full">{data?.lugar_ejecucion || '—'}</div>
      ),
    },
    {
      headerName: 'Duración',
      field: 'duracion_cantidad',
      width: 130,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoServicio>) => (
        <div className="flex items-center h-full font-semibold text-emerald-600">
          {data?.duracion_cantidad ? `${data.duracion_cantidad} ${data.duracion_unidad || ''}` : '—'}
        </div>
      ),
    },
    {
      headerName: 'Presupuesto',
      field: 'presupuesto_referencial',
      width: 140,
      minWidth: 110,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoServicio>) => (
        <div className="flex items-center h-full font-bold text-emerald-700">
          {data?.presupuesto_referencial ? `S/ ${Number(data.presupuesto_referencial).toFixed(2)}` : '—'}
        </div>
      ),
    },
    {
      headerName: 'Fecha Inicio',
      field: 'fecha_inicio_estimada',
      width: 130,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoServicio>) => (
        <div className="flex items-center h-full text-xs">{data?.fecha_inicio_estimada || '—'}</div>
      ),
    },
  ], [])

  return (
    <ContenedorGeneral className="h-full">
      <Suspense fallback={<div className="h-20" />}>
        <FiltersMisOS onNueva={() => setModalNuevoOpen(true)} />
      </Suspense>

      <div className="w-full mt-4">
        <div className="h-[450px]">
          <Suspense fallback={<ComponentLoading />}>
            <TableMisOS
              id="g-c-e-i.mis-ordenes-de-servicio.lista"
              columns={columns}
              filtros={filtros}
              selectionColor="#dcfce7"
              onRowSelected={(event: RowSelectedEvent<RequerimientoInterno>) => {
                if (event.node.isSelected() && event.data) {
                  setFilaSeleccionada(event.data)
                } else {
                  setFilaSeleccionada(null)
                }
              }}
            />
          </Suspense>
        </div>
      </div>

      {/* ═══════ DETALLE DEL SERVICIO SELECCIONADO ═══════ */}
      <div className="w-full mt-4">
        <div className="h-[250px]">
          <TableWithTitle<RequerimientoInternoServicio>
            id="g-c-e-i.mis-ordenes-de-servicio.detalle-servicio"
            title="Servicio Requerido"
            extraTitle={
              filaSeleccionada ? (
                <Tag color="green" className="!rounded-full !text-[10px] !font-bold !border-none">
                  {filaSeleccionada.codigo}
                </Tag>
              ) : null
            }
            columnDefs={columnsDetalle}
            rowData={servicioRowData}
            rowSelection={false}
            withNumberColumn={false}
            exportExcel={false}
            exportPdf={false}
            selectColumns={false}
            selectionColor="transparent"
          />
        </div>
      </div>

      <Suspense fallback={null}>
        <ModalDetalleRequerimiento
          open={modalDetalleOpen}
          requerimiento={seleccionado}
          onClose={() => {
            setModalDetalleOpen(false)
            setSeleccionado(null)
          }}
        />
      </Suspense>

      <ModalRequerimientoInterno
        open={modalNuevoOpen}
        onClose={() => {
          setModalNuevoOpen(false)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
        }}
        defaultTipoSolicitud="OS"
      />

      <ModalPdfViewer
        open={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false)
          setSeleccionado(null)
        }}
        document={
          seleccionado ? (
            <RequerimientoInternoPdf requerimiento={seleccionado} empresa={empresa} />
          ) : (
            <></>
          )
        }
        fileName={seleccionado ? `${seleccionado.codigo}-LOG-F-03` : 'documento'}
        title={seleccionado ? `PDF - ${seleccionado.codigo}` : 'PDF'}
      />
    </ContenedorGeneral>
  )
}
