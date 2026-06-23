'use client'

import type { ColDef } from 'ag-grid-community'
import type { EntregaNueva } from '~/lib/api/entregas'
import { formatFechaPeru } from '~/utils/fechas'
import { TIPO_ENTREGA_LABEL_CON_ICON } from '~/app/_lib/entrega-labels'
import CellAccionesHistorial from './cell-acciones-historial'

const ESTADO_HEX: Record<string, string> = {
  pe: '#d97706', ec: '#3b82f6', en: '#16a34a', ca: '#ef4444',
}

export function useColsHistorialEntrega({ onRefetch, entregas }: { onRefetch?: () => void; entregas?: EntregaNueva[] } = {}): ColDef<EntregaNueva>[] {
  const esRecojoTienda = entregas?.every(e => e.tipo_entrega_codigo === 'rt') ?? false

  const colsBase: ColDef<EntregaNueva>[] = [
    {
      colId: 'secuencia', field: 'venta_entrega_secuencia', headerName: '#', width: 40,
      cellStyle: { textAlign: 'center', fontWeight: '700', color: '#94a3b8', fontSize: '12px' },
    },
    {
      colId: 'tipo', headerName: 'Tipo', width: 155,
      cellRenderer: ({ data: d }: { data: EntregaNueva }) => {
        const subLabel = d.tipo_entrega_codigo === 'pa'
          ? d.quien_entrega_codigo === 'chofer' ? 'A Domicilio' : 'En Tienda'
          : null
        return (
          <div className="flex flex-col justify-center h-full leading-tight">
            <span className="text-xs font-semibold text-slate-700">
              {TIPO_ENTREGA_LABEL_CON_ICON[d.tipo_entrega_codigo ?? ''] ?? d.tipo_entrega_nombre ?? '—'}
            </span>
            {subLabel && (
              <span className="text-[10px] text-slate-400">{subLabel}</span>
            )}
          </div>
        )
      },
    },
    {
      colId: 'productos', headerName: 'Producto', flex: 1, minWidth: 160,
      cellRenderer: ({ data: d }: { data: EntregaNueva }) => {
        const detalles = d.detalles ?? []
        if (!detalles.length) return <div className="flex items-center h-full text-slate-300 text-xs">—</div>
        const primero = detalles[0]
        const resto   = detalles.length - 1
        return (
          <div className="flex flex-col justify-center h-full leading-tight">
            <div className="text-xs font-medium text-slate-800 truncate">
              {primero.producto?.name ?? '—'}
            </div>
            <div className="text-[10px] text-slate-400">
              {primero.producto?.cod_producto ?? ''}
              {primero.cantidad ? ` · x${primero.cantidad}` : ''}
              {resto > 0 && <span className="ml-1 text-blue-400">+{resto} más</span>}
            </div>
          </div>
        )
      },
    },
    {
      colId: 'fechas', headerName: 'Fechas', width: 140,
      cellRenderer: ({ data: d }: { data: EntregaNueva }) => (
        <div className="flex flex-col justify-center h-full leading-tight gap-0.5 text-[10px]">
          {d.fecha_programada && (
            <span className="text-slate-500">
              📅 {formatFechaPeru(d.fecha_programada, 'YYYY-MM-DD HH:mm:ss')}
              {d.hora_inicio ? ` ${d.hora_inicio}${d.hora_fin ? `–${d.hora_fin}` : ''}` : ''}
            </span>
          )}
          {d.fecha_ejecutada && (
            <span className="text-green-600 font-semibold">
              ✅ {formatFechaPeru(d.fecha_ejecutada, 'YYYY-MM-DD HH:mm:ss')}
            </span>
          )}
          {!d.fecha_programada && !d.fecha_ejecutada && d.fecha_creacion && (
            <span className="text-slate-400">
              🕐 {formatFechaPeru(d.fecha_creacion, 'YYYY-MM-DD HH:mm:ss')}
            </span>
          )}
        </div>
      ),
    },
    {
      colId: 'estado', headerName: 'Estado', width: 100,
      cellRenderer: ({ data: d }: { data: EntregaNueva }) => {
        const c = ESTADO_HEX[d.estado_entrega_codigo ?? ''] ?? '#64748b'
        return (
          <div className="flex items-center h-full">
            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: `${c}20`, color: c, border: `1px solid ${c}40` }}>
              {d.estado_entrega_nombre ?? '—'}
            </span>
          </div>
        )
      },
    },
    {
      colId: 'quien_despacha', headerName: 'Despacha', width: 160,
      cellRenderer: ({ data: d }: { data: EntregaNueva }) => (
        <div className="flex flex-col justify-center h-full leading-tight gap-0.5">
          <span className="text-xs font-semibold text-slate-700">{d.quien_entrega_nombre ?? '—'}</span>
          {d.chofer_name        && <span className="text-[10px] text-slate-500">👤 {d.chofer_name}</span>}
          {d.vehiculo_name      && <span className="text-[10px] text-slate-400">🚗 {d.vehiculo_name}{d.vehiculo_placa ? ` · ${d.vehiculo_placa}` : ''}</span>}
          {d.user_entregado_name && <span className="text-[10px] text-green-600">✅ {d.user_entregado_name}</span>}
        </div>
      ),
    },
    {
      colId: 'direccion', headerName: 'Dirección', width: 180,
      cellRenderer: ({ data: d }: { data: EntregaNueva }) => {
        if (!d.direccion_entrega && !d.latitud) return <div className="flex items-center h-full text-slate-300 text-xs">—</div>
        const mapaUrl = d.latitud && d.longitud
          ? `https://www.google.com/maps?q=${d.latitud},${d.longitud}`
          : null
        return (
          <div className="flex flex-col justify-center h-full leading-tight gap-0.5">
            <span className="text-[11px] text-slate-700 truncate" title={d.direccion_entrega ?? ''}>
              📍 {d.direccion_entrega ?? 'Sin dirección'}
            </span>
            {d.referencia_entrega && (
              <span className="text-[10px] text-slate-400 truncate" title={d.referencia_entrega}>
                Ref: {d.referencia_entrega}
              </span>
            )}
            {mapaUrl && (
              <a href={mapaUrl} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-blue-500 hover:text-blue-700"
                onClick={(e) => e.stopPropagation()}>
                Ver en mapa →
              </a>
            )}
          </div>
        )
      },
    },
    {
      colId: 'devolvio', headerName: 'Devolvió', width: 80,
      valueGetter: ({ data: d }: { data: EntregaNueva | undefined }) => {
        if (!d || d.estado_entrega_codigo !== 'ca') return 0
        return (d.detalles ?? []).reduce((s, det) => s + Number(det.cantidad ?? 0), 0)
      },
      cellStyle: (p: { value: number }) => ({
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '13px',
        color: p.value > 0 ? '#dc2626' : '#94a3b8',
      }),
    },
    {
      colId: 'acciones', headerName: 'Acciones', width: 90,
      pinned: 'right' as const, sortable: false, filter: false,
      cellRenderer: CellAccionesHistorial,
      cellRendererParams: (params: { data?: EntregaNueva }) => ({ entrega: params.data, onRefetch }),
    },
  ]

  const colsCantidades: ColDef<EntregaNueva>[] = esRecojoTienda ? [] : [
    {
      colId: 'programada', headerName: 'Programada', width: 90,
      cellStyle: { textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '12px' },
      valueGetter: ({ data }) => data?.detalles?.reduce((s, d) => s + (d.cantidad ?? 0), 0) ?? 0,
    },
    {
      colId: 'pendiente', headerName: 'Pendiente', width: 90,
      cellStyle: { textAlign: 'center', color: '#ea580c', fontWeight: '700', fontSize: '12px' },
      valueGetter: ({ data }) => data?.detalles?.reduce((s, d) => s + (d.cantidad_pendiente ?? 0), 0) ?? 0,
    },
  ]

  return [...colsBase, ...colsCantidades]
}
