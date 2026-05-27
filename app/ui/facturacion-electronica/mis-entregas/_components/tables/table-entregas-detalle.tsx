'use client'

import { useRef, memo, useCallback, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import useEntregasDeVenta from '../../_hooks/use-entregas-de-venta'
import { useStoreEntregaSeleccionada } from '../../_store/store-entrega-seleccionada'
import type { EntregaNueva } from '~/lib/api/entregas'
import dayjs from 'dayjs'
import { orangeColors } from '~/lib/colors'

const ESTADO_COLOR: Record<string, string> = {
  pe: 'bg-amber-100 text-amber-800 border-amber-300',
  ec: 'bg-blue-100 text-blue-800 border-blue-300',
  en: 'bg-green-100 text-green-800 border-green-300',
  ca: 'bg-red-100 text-red-700 border-red-300',
}

function CellEstado({ data }: { data: EntregaNueva }) {
  const codigo = data.estado_entrega_codigo ?? ''
  const nombre = data.estado_entrega_nombre ?? '—'
  return (
    <div className="flex items-center h-full">
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_COLOR[codigo] ?? 'bg-gray-100 text-gray-700'}`}>
        {nombre}
      </span>
    </div>
  )
}

const TIPO_ENTREGA_BADGE: Record<string, { label: string; icon: string; cls: string }> = {
  rt: { label: 'Tienda',    icon: '🏪', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  de: { label: 'Domicilio', icon: '🏠', cls: 'bg-blue-100   text-blue-800   border-blue-300'   },
  pa: { label: 'Parcial',   icon: '📦', cls: 'bg-violet-100 text-violet-800 border-violet-300' },
}

const TIPO_DESPACHO_BADGE: Record<string, { label: string; cls: string }> = {
  in: { label: 'Inmediato',  cls: 'bg-cyan-50   text-cyan-700   border-cyan-300'   },
  pr: { label: 'Programado', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
}

function CellTipoEntrega({ data }: { data: EntregaNueva }) {
  const te = TIPO_ENTREGA_BADGE[data.tipo_entrega_codigo ?? '']
  const td = TIPO_DESPACHO_BADGE[data.tipo_despacho_codigo ?? '']
  return (
    <div className="flex items-center gap-1 h-full">
      {te ? (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${te.cls}`}>
          {te.icon} {te.label}
        </span>
      ) : (
        <span className="text-slate-400 text-xs">—</span>
      )}
      {td && (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${td.cls}`}>
          {td.label}
        </span>
      )}
    </div>
  )
}

function CellChofer({ data }: { data: EntregaNueva }) {
  if (!data.chofer_name) return <span className="text-slate-400 text-sm">—</span>
  return (
    <div className="flex flex-col justify-center h-full leading-tight">
      <span className="text-sm text-slate-800">{data.chofer_name}</span>
      {data.vehiculo_placa && (
        <span className="text-[10px] text-slate-500">{data.vehiculo_placa}</span>
      )}
    </div>
  )
}

function CellFecha({ data }: { data: EntregaNueva }) {
  if (data.fecha_ejecutada) {
    return (
      <div className="flex flex-col justify-center h-full leading-tight">
        <span className="text-[10px] text-green-600 font-semibold">✅ Entregado</span>
        <span className="text-xs text-slate-600">{dayjs(data.fecha_ejecutada).format('DD/MM/YY HH:mm')}</span>
      </div>
    )
  }
  const fecha = data.fecha_programada ?? data.fecha_creacion
  if (!fecha) return <span className="text-slate-400">—</span>
  return (
    <div className="flex flex-col justify-center h-full leading-tight">
      <span className="text-[10px] text-amber-600 font-semibold">{data.fecha_programada ? '📅 Programado' : '🕐 Creado'}</span>
      <span className="text-xs text-slate-600">
        {dayjs(fecha).format('DD/MM/YY')}
        {data.fecha_programada && data.hora_inicio ? ` ${data.hora_inicio}` : ''}
      </span>
    </div>
  )
}

function CellCantidades({ data }: { data: EntregaNueva }) {
  const detalles = data.detalles ?? []
  const programada = detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0)
  const pendiente  = detalles.reduce((s, d) => s + Number(d.cantidad_pendiente ?? 0), 0)
  const entregado  = programada - pendiente
  if (programada === 0) return <span className="text-slate-300 text-xs">—</span>
  return (
    <div className="flex flex-col justify-center h-full leading-tight text-[11px]">
      <span className="text-slate-500">Prog: <span className="font-semibold text-slate-700">{programada}</span></span>
      <span className="text-green-600">Entg: <span className="font-semibold">{entregado}</span></span>
      {pendiente > 0 && <span className="text-amber-600">Pend: <span className="font-semibold">{pendiente}</span></span>}
    </div>
  )
}

const columnDefs: ColDef<EntregaNueva>[] = [
  {
    headerName: '#',
    field: 'venta_entrega_secuencia',
    width: 55,
    cellStyle: { textAlign: 'center', fontWeight: 700, color: '#64748b' },
  },
  {
    headerName: 'Estado',
    width: 120,
    cellRenderer: CellEstado,
  },
  {
    headerName: 'Tipo',
    width: 210,
    cellRenderer: CellTipoEntrega,
  },
  {
    headerName: 'Chofer / Vehículo',
    width: 160,
    cellRenderer: CellChofer,
  },
  {
    headerName: 'Fecha',
    width: 140,
    cellRenderer: CellFecha,
  },
  {
    headerName: 'Cantidades',
    width: 120,
    cellRenderer: CellCantidades,
  },
  {
    headerName: 'Dirección',
    field: 'direccion_entrega',
    flex: 1,
    minWidth: 120,
    valueFormatter: ({ value }) => value ?? '—',
    cellStyle: { fontSize: '12px', color: '#475569' },
  },
  {
    headerName: 'Productos',
    width: 100,
    cellRenderer: ({ data }: { data: EntregaNueva }) => {
      const items = data?.detalles?.length ?? 0
      if (items === 0) return <span className="text-slate-400 text-xs">—</span>
      return (
        <span className="text-sm font-semibold text-slate-700">{items} ítem{items !== 1 ? 's' : ''}</span>
      )
    },
  },
]

interface Props {
  ventaId: string | undefined
}

const TableEntregasDetalle = memo(function TableEntregasDetalle({ ventaId }: Props) {
  const gridRef = useRef<AgGridReact<EntregaNueva>>(null)
  const { entregas, loading } = useEntregasDeVenta(ventaId)
  const setEntrega = useStoreEntregaSeleccionada(s => s.setEntrega)

  const onSelectionChanged = useCallback((e: SelectionChangedEvent<EntregaNueva>) => {
    const selected = e.api.getSelectedRows()
    setEntrega(selected[0])
  }, [setEntrega])

  // Auto-seleccionar la primera entrega cuando carga la data
  useEffect(() => {
    if (!entregas.length) { setEntrega(undefined); return }
    const api = gridRef.current?.api
    if (!api) return
    // Pequeño delay para que AG Grid termine de renderizar las filas
    setTimeout(() => {
      const firstNode = api.getDisplayedRowAtIndex(0)
      if (firstNode) {
        api.deselectAll()
        firstNode.setSelected(true)
      }
    }, 50)
  }, [entregas, setEntrega])

  return (
    <TableWithTitle<EntregaNueva>
      id="mis-entregas-entregas-detalle"
      title={ventaId ? `Entregas de la venta seleccionada` : 'Seleccione una venta'}
      tableRef={gridRef}
      rowData={entregas}
      columnDefs={columnDefs}
      selectionColor={orangeColors[10]}
      loading={loading}
      rowSelection={true}
      withNumberColumn={false}
      onSelectionChanged={onSelectionChanged}
      getRowId={({ data }) => String(data.id)}
    />
  )
})

export default TableEntregasDetalle
