'use client'

import { useRef, memo, useCallback, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import useResumenVentas from '../../_hooks/use-resumen-ventas'
import { useStoreVentaSeleccionada } from '../../_store/store-venta-seleccionada'
import { useStoreEntregaSeleccionada } from '../../_store/store-entrega-seleccionada'
import type { ResumenVenta } from '~/lib/api/entregas'
import { orangeColors } from '~/lib/colors' 
import { formatFechaPeru } from "~/utils/fechas";

import dayjs from 'dayjs'

// Cell renderer: mini-pills de estado
function CellResumenMini({ data }: { data: ResumenVenta }) {
  // Venta sin ninguna entrega registrada (domicilio omitida, etc.)
  if (data.sin_entregas) {
    return (
      <div className="flex items-center gap-1 h-full">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-400 text-white text-[10px] font-bold">
          Sin entrega
        </span>
      </div>
    )
  }

  const pills = [
    { count: data.completadas, color: 'bg-green-500', label: 'Entregado' },
    { count: data.en_camino,   color: 'bg-blue-500',  label: 'En camino' },
    { count: data.pendientes,  color: 'bg-amber-500', label: 'Pendiente' },
    { count: data.canceladas,  color: 'bg-red-400',   label: 'Cancelado' },
  ].filter(p => p.count > 0)

  return (
    <div className="flex items-center gap-1 h-full">
      {pills.map(p => (
        <span
          key={p.label}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${p.color}`}
        >
          {p.count} {p.label}
        </span>
      ))}
      {pills.length === 0 && (
        <span className="text-slate-400 text-xs">—</span>
      )}
    </div>
  )
}

const columnDefs: ColDef<ResumenVenta>[] = [
  {
    colId: 'venta_numero',
    headerName: 'Venta',
    field: 'venta_numero',
    width: 110,
    pinned: 'left',
    cellStyle: { fontWeight: 600 },
  },
  {
    colId: 'cliente_nombre',
    headerName: 'Cliente',
    field: 'cliente_nombre',
    flex: 1,
    minWidth: 180,
  },
  {
    colId: 'fecha',
    headerName: 'Fecha',
    field: 'fecha',
    width: 110,
    valueFormatter: (params) =>
            formatFechaPeru(params.value, "DD/MM/YYYY hh:mm:ss A"),
  },
  {
    colId: 'estado',
    headerName: 'Estado',
    flex: 1,
    minWidth: 180,
    cellRenderer: CellResumenMini,
  },
  {
    colId: 'proxima_fecha',
    headerName: 'Próxima fecha',
    field: 'proxima_fecha_programada',
    width: 130,
    valueFormatter: ({ value }) => value ? dayjs(value).format('DD/MM/YY') : '—',
  },
]

const TableResumenVentas = memo(function TableResumenVentas() {
  const gridRef = useRef<AgGridReact<ResumenVenta>>(null)
  const { ventas, loading } = useResumenVentas()
  const setVenta = useStoreVentaSeleccionada(s => s.setVenta)
  const setEntrega = useStoreEntregaSeleccionada(s => s.setEntrega)

  const onSelectionChanged = useCallback((e: SelectionChangedEvent<ResumenVenta>) => {
    const selected = e.api.getSelectedRows()
    const venta = selected[0]
    setVenta(venta)
    setEntrega(undefined)
  }, [setVenta, setEntrega])

  // Auto-seleccionar la primera venta cuando carga la data
  useEffect(() => {
    if (!ventas.length) return
    const api = gridRef.current?.api
    if (!api) return
    setTimeout(() => {
      const firstNode = api.getDisplayedRowAtIndex(0)
      if (firstNode && !api.getSelectedRows().length) {
        firstNode.setSelected(true)
      }
    }, 50)
  }, [ventas])

  return (
    <TableWithTitle<ResumenVenta>
      id="mis-entregas-resumen-ventas"
      title="Ventas con Entregas"
      tableRef={gridRef}
      rowData={ventas}
      columnDefs={columnDefs}
      selectionColor={orangeColors[10]}
      loading={loading}
      rowSelection={true}
      onSelectionChanged={onSelectionChanged}
      getRowId={({ data }) => data.venta_id}
    />
  )
})

export default TableResumenVentas
