'use client'

import { useRef, memo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import useEntregasDeVenta from '../../_hooks/use-entregas-de-venta'
import { useStoreEntregaSeleccionada } from '../../_store/store-entrega-seleccionada'
import type { EntregaNueva } from '~/lib/api/entregas'
import dayjs from 'dayjs'

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

function CellTipoEntrega({ data }: { data: EntregaNueva }) {
  return (
    <div className="flex items-center gap-1.5 h-full text-sm">
      <span className="text-slate-700">{data.tipo_entrega_nombre ?? '—'}</span>
      {data.tipo_despacho_codigo === 'pr' && (
        <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">PROG</span>
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
  const fecha = data.fecha_programada ?? data.fecha_creacion
  if (!fecha) return <span className="text-slate-400">—</span>
  const es_programada = !!data.fecha_programada
  return (
    <div className="flex flex-col justify-center h-full leading-tight">
      <span className="text-sm">{dayjs(fecha).format('DD/MM/YY')}</span>
      {es_programada && data.hora_inicio && (
        <span className="text-[10px] text-slate-500">{data.hora_inicio}</span>
      )}
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
    width: 170,
    cellRenderer: CellTipoEntrega,
  },
  {
    headerName: 'Chofer / Vehículo',
    width: 160,
    cellRenderer: CellChofer,
  },
  {
    headerName: 'Fecha',
    width: 110,
    cellRenderer: CellFecha,
  },
  {
    headerName: 'Dirección',
    field: 'direccion_entrega',
    flex: 1,
    minWidth: 150,
    valueFormatter: ({ value }) => value ?? '—',
    cellStyle: { fontSize: '12px', color: '#475569' },
  },
  {
    headerName: 'Productos',
    width: 90,
    valueGetter: ({ data }) => data?.detalles?.length ?? 0,
    cellStyle: { textAlign: 'center' },
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

  return (
    <TableWithTitle<EntregaNueva>
      id="mis-entregas-entregas-detalle"
      title={ventaId ? `Entregas de la venta seleccionada` : 'Seleccione una venta'}
      tableRef={gridRef}
      rowData={entregas}
      columnDefs={columnDefs}
      loading={loading}
      rowSelection={true}
      onSelectionChanged={onSelectionChanged}
      getRowId={({ data }) => String(data.id)}
    />
  )
})

export default TableEntregasDetalle
