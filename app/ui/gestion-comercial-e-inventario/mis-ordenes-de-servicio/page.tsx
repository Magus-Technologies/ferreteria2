'use client'

import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { Spin, App, Tag, Tooltip, Input } from 'antd'
import { formatFechaPeru } from '~/utils/fechas'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { ColDef, ICellRendererParams, SelectionChangedEvent } from 'ag-grid-community'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { type RequerimientoInterno, type RequerimientoInternoServicio, requerimientoInternoApi } from '~/lib/api/requerimiento-interno'
import { useAuth } from '~/lib/auth-context'
import { useStoreFiltrosMisOS } from './_store/store-filtros-mis-os'
import { useColumnsMisOS } from './_components/tables/columns-mis-os'
import ModalRequerimientoServicio from '../_components/modals/modal-requerimiento-servicio'
import ModalEscalarSuperior from './_components/modals/modal-escalar-superior'
import ModalReasignarCargo from './_components/modals/modal-reasignar-cargo'
import ModalDocOrdenServicio from './_components/modals/modal-doc-orden-servicio'
import TableWithTitle from '~/components/tables/table-with-title'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

const FiltersMisOS = lazy(() => import('./_components/filters/filters-mis-os'))
const TableMisOS = lazy(() => import('./_components/tables/table-mis-os'))
const ModalDetalleRequerimiento = lazy(() => import('../mis-requerimientos-internos/_components/modal-detalle-requerimiento'))
const ModalProgramarOS = lazy(() => import('./_components/modals/modal-programar-os').then(mod => ({ default: mod.ModalProgramarOS })))

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisOrdenesDeServicio() {
  const { modal, message } = App.useApp()
  const queryClient = useQueryClient()
  const filtros = useStoreFiltrosMisOS(state => state.filtros)
  const { user } = useAuth()

  const [seleccionado, setSeleccionado] = useState<RequerimientoInterno | null>(null)
  const [filaSeleccionada, setFilaSeleccionada] = useState<RequerimientoInterno | null>(null)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [modalEscalarOpen, setModalEscalarOpen] = useState(false)
  const [modalReasignarOpen, setModalReasignarOpen] = useState(false)
  const [modalProgramarOSOpen, setModalProgramarOSOpen] = useState(false)

  // Obtener el cargo del usuario actual desde el contexto de autenticación
  // Usamos el nombre del cargo (string) para comparar con el cargo requerido en la OS
  const userCargoId = user?.cargo || undefined

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
          {row.servicios && row.servicios.length > 0 && (
            <div className='mt-2'>
              <p className='text-xs font-bold text-slate-600 uppercase tracking-tight'>Servicios:</p>
              <ul className='text-xs text-slate-500 list-disc ml-4'>
                {row.servicios.slice(0, 3).map((s, i) => (
                  <li key={i}>{s.tipo_servicio}: {s.descripcion_servicio}</li>
                ))}
                {row.servicios.length > 3 && <li>y {row.servicios.length - 3} más...</li>}
              </ul>
            </div>
          )}
        </div>
      ),
      okText: 'Sí, Aprobar',
      okType: 'primary',
      cancelText: 'Cancelar',
      async onOk() {
        // apiRequest no lanza en errores HTTP (403/500, etc.) — devuelve
        // {data, error}. El try/catch de acá nunca se disparaba, así que un
        // rechazo del backend (ej. sin autoridad) se mostraba igual como
        // "aprobado correctamente" sin que nada cambiara realmente.
        const res = await requerimientoInternoApi.aprobar(row.id)
        if (res.error) {
          message.error(res.error.message || 'Error al aprobar la orden de servicio')
          return Promise.reject()
        }
        message.success(`${row.codigo} aprobado correctamente`)
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
      },
    })
  }, [modal, message, queryClient])

  const handleDesaprobar = useCallback((row: RequerimientoInterno) => {
    modal.confirm({
      title: '¿Desaprobar Orden de Servicio?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p>¿Estás seguro de desaprobar <strong>{row.codigo}</strong>?</p>
          <p className='text-sm text-slate-500 mt-1'>{row.titulo}</p>
          <p className='text-xs text-slate-500 mt-1'>
            Volverá a estado pendiente y, si bloqueaba un vehículo en el calendario, el bloqueo se elimina.
          </p>
        </div>
      ),
      okText: 'Sí, Desaprobar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        const res = await requerimientoInternoApi.desaprobar(row.id)
        if (res.error) {
          message.error(res.error.message || 'Error al desaprobar la orden de servicio')
          return Promise.reject()
        }
        message.success(`${row.codigo} desaprobado: volvió a pendiente`)
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
      },
    })
  }, [modal, message, queryClient])

  const handleRechazar = useCallback((row: RequerimientoInterno) => {
    // El backend exige motivo (reason) para rechazar
    let motivo = ''
    modal.confirm({
      title: '¿Rechazar Orden de Servicio?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p>¿Estás seguro de rechazar <strong>{row.codigo}</strong>?</p>
          <p className='text-sm text-slate-500 mt-1'>{row.titulo}</p>
          <Input.TextArea
            rows={2}
            placeholder='Motivo del rechazo (obligatorio)'
            className='mt-2'
            onChange={(e) => { motivo = e.target.value }}
          />
        </div>
      ),
      okText: 'Sí, Rechazar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        if (!motivo.trim()) {
          message.warning('Ingresa el motivo del rechazo')
          return Promise.reject()
        }
        const res = await requerimientoInternoApi.rechazar(row.id, { reason: motivo.trim() })
        if (res.error) {
          message.error(res.error.message || 'Error al rechazar la orden de servicio')
          return Promise.reject()
        }
        message.success(`${row.codigo} rechazada`)
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
      },
    })
  }, [modal, message, queryClient])

  const handleEscalar = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setModalEscalarOpen(true)
  }, [])

  const handleReasignar = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setModalReasignarOpen(true)
  }, [])

  const esRootCargo = user?.es_root_cargo ?? false
  const columns = useColumnsMisOS({
    onView: handleView,
    onViewPdf: handleViewPdf,
    onAprobar: handleAprobar,
    onDesaprobar: handleDesaprobar,
    onRechazar: handleRechazar,
    onEscalar: handleEscalar,
    onReasignar: handleReasignar,
    userCargoId,
    esRootCargo,
  })

  const servicioRowData = useMemo(() => {
    if (!filaSeleccionada?.servicios) return []
    // Inyectamos la fecha de creación del padre para que esté disponible en la tabla de abajo
    return filaSeleccionada.servicios.map(s => ({
      ...s,
      fecha_solicitud_padre: filaSeleccionada.created_at
    }))
  }, [filaSeleccionada])

  const columnsDetalle = useMemo<ColDef[]>(() => [
    {
      headerName: 'Fecha Solicitado',
      field: 'fecha_solicitud_padre',
      width: 150,
      minWidth: 130,
      cellRenderer: ({ data }: any) => (
        <div className="flex items-center h-full text-xs font-semibold text-slate-500">
          {formatFechaPeru(data?.fecha_solicitud_padre, 'DD/MM/YYYY HH:mm') || '—'}
        </div>
      ),
    },
    {
      headerName: 'Tipo Servicio',
      field: 'tipo_servicio',
      width: 140,
      minWidth: 120,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <Tag color="green" className="!rounded-md !font-semibold">{data?.tipo_servicio || '—'}</Tag>
        </div>
      ),
    },
    {
      headerName: 'Descripción',
      field: 'descripcion_servicio',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className="flex items-center h-full text-slate-700 font-medium text-xs overflow-hidden text-ellipsis whitespace-nowrap">
          {data?.descripcion_servicio || '—'}
        </div>
      ),
    },
    {
      headerName: 'Detalles / Tareas',
      field: 'detalles',
      flex: 1,
      minWidth: 250,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <Tooltip title={data?.detalles}>
          <div className="flex items-center h-full text-slate-500 text-[11px] italic overflow-hidden text-ellipsis whitespace-nowrap">
            {data?.detalles || '—'}
          </div>
        </Tooltip>
      ),
    },
    {
      headerName: 'Lugar',
      field: 'lugar_ejecucion',
      width: 150,
      minWidth: 120,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className="flex items-center h-full text-xs">{data?.lugar_ejecucion || '—'}</div>
      ),
    },
    {
      headerName: 'Duración',
      field: 'duracion_cantidad',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }: ICellRendererParams) => {
        const cantidad = data?.duracion_cantidad
        const unidad = data?.duracion_unidad
        if (!cantidad) return <div className="flex items-center h-full font-semibold text-emerald-600 text-xs">—</div>
        const horas = unidad === 'minutos' ? Math.round(cantidad / 60) : cantidad
        return (
          <div className="flex items-center h-full font-semibold text-emerald-600 text-xs">
            {horas} h
          </div>
        )
      },
    },
    {
      headerName: 'Presupuesto',
      field: 'presupuesto_referencial',
      width: 130,
      minWidth: 110,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className="flex items-center h-full font-bold text-emerald-700 text-xs">
          {data?.presupuesto_referencial ? `S/ ${Number(data.presupuesto_referencial).toFixed(2)}` : '—'}
        </div>
      ),
    },
    {
      headerName: 'Inicio Estimado',
      field: 'fecha_inicio_estimada',
      width: 140,
      minWidth: 120,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className="flex items-center h-full text-xs text-slate-600">
          {formatFechaPeru(data?.fecha_inicio_estimada, 'DD/MM/YYYY HH:mm') || '—'}
        </div>
      ),
    },
  ], [])

  return (
    <ContenedorGeneral className="h-full">
      <ConfigurableElement componentId="mis-ordenes-de-servicio.filtros" label="Filtros y acciones de Órdenes de Servicio">
      <Suspense fallback={<div className="h-20" />}>
        <FiltersMisOS onNueva={() => setModalNuevoOpen(true)} />
      </Suspense>
      </ConfigurableElement>

      {/*
        Las dos tablas se reparten lo que queda de pantalla en vez de tener alto
        fijo (eran 450px + 250px + margenes = 732px, y con los filtros arriba el
        contenido pasaba el viewport: de ahi el scroll de la pagina).

        Cada tabla scrollea internamente, que es lo suyo. Los 230px que se restan
        son el alto de lo que va ARRIBA (header de la app, padding, titulo y fila
        de filtros): es el unico numero a tocar si sobra o falta aire.

        La lista va 2/3 y el detalle 1/3, respetando la proporcion que tenian.
      */}
      <div className="w-full mt-4 flex flex-col gap-4 h-[calc(100vh-230px)] min-h-[520px]">
        {/* min-h-0: sin esto un hijo flex no se encoge por debajo de su
            contenido y el reparto de altura no se respeta. */}
        <div className="flex-[2] min-h-0">
          <Suspense fallback={<ComponentLoading />}>
            <TableMisOS
              id="g-c-e-i.mis-ordenes-de-servicio.lista"
              columns={columns}
              filtros={filtros}
              selectionColor="#dcfce7"
              onSelectionChanged={useCallback((event: SelectionChangedEvent<RequerimientoInterno>) => {
                const selectedNodes = event.api.getSelectedNodes()
                const data = selectedNodes?.[0]?.data
                setFilaSeleccionada(data || null)
              }, [])}
            />
          </Suspense>
        </div>

        {/* ═══════ DETALLE DEL SERVICIO SELECCIONADO ═══════ */}
        <div className="flex-1 min-h-0">
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

      <ModalRequerimientoServicio
        open={modalNuevoOpen}
        onClose={() => {
          setModalNuevoOpen(false)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
        }}
      />

      <ModalEscalarSuperior
        open={modalEscalarOpen}
        requerimiento={seleccionado}
        onClose={() => {
          setModalEscalarOpen(false)
          setSeleccionado(null)
        }}
      />

      <ModalReasignarCargo
        open={modalReasignarOpen}
        requerimiento={seleccionado}
        onClose={() => {
          setModalReasignarOpen(false)
          setSeleccionado(null)
        }}
      />

      <ModalDocOrdenServicio
        open={pdfModalOpen}
        requerimiento={seleccionado}
        onClose={() => {
          setPdfModalOpen(false)
          setSeleccionado(null)
        }}
      />

      <Suspense fallback={null}>
        <ModalProgramarOS
          open={modalProgramarOSOpen && seleccionado?.approval_state !== 'aprobado'}
          requerimiento={seleccionado}
          onClose={() => {
            setModalProgramarOSOpen(false)
            setSeleccionado(null)
          }}
          onAplicar={async (fechaInicio: string) => {
            try {
              if (!seleccionado) return
              // Aquí iría la lógica para actualizar la fecha de la OS
              message.success('Fecha programada correctamente')
              queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
              setModalProgramarOSOpen(false)
              setSeleccionado(null)
            } catch (error: any) {
              const errorMsg = error?.response?.data?.message || 'Error al programar la orden de servicio'
              message.error(errorMsg)
              console.error(error)
            }
          }}
        />
      </Suspense>
    </ContenedorGeneral>
  )
}
