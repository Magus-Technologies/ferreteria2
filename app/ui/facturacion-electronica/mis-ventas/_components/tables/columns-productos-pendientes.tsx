'use client'

import { memo, useState, useEffect } from 'react'
import { InputNumber } from 'antd'
import type { ColDef } from 'ag-grid-community'

export interface FilaProducto {
  key: string; udvId: string; nombre: string; codigo: string
  marca: string; unidad: string; total: number; entregado: number
  pendiente: number; cantAProgramar: number
}

const CantCell = memo(function CantCell({ rowKey, init, max, onCommit, onChangeRef }: {
  rowKey: string; init: number; max: number
  onCommit: (k: string, v: number) => void
  onChangeRef?: (k: string, v: number) => void
}) {
  const [val, setVal] = useState<number | null>(init)
  useEffect(() => { setVal(init) }, [init])

  if (max === 0) {
    return <div className="flex items-center h-full px-2"><span className="text-slate-300">—</span></div>
  }

  const clamp = (v: number | null) => Math.max(0, Math.min(Math.round(Number(v) || 0), max))
  const commit = () => onCommit(rowKey, clamp(val))
  return (
    <div className="flex items-center h-full">
      <InputNumber size="small" value={val} min={0} max={max} precision={0}
        onChange={(v) => { setVal(v); onChangeRef?.(rowKey, clamp(v)) }}
        onBlur={commit} onPressEnter={commit} style={{ width: '100%' }} />
    </div>
  )
})

export function useColsProductosPendientes({
  onCommit,
  onChangeRef,
  includeAProgramar = true,
  aProgramarLabel = 'A programar',
}: {
  onCommit: (key: string, value: number) => void
  onChangeRef?: (key: string, value: number) => void
  includeAProgramar?: boolean
  aProgramarLabel?: string
}): ColDef<FilaProducto>[] {
  const baseCols: ColDef<FilaProducto>[] = [
    {
      colId: 'nombre', field: 'nombre', headerName: 'Producto', flex: 1, minWidth: 140,
      cellRenderer: ({ data: d }: { data: FilaProducto }) => (
        <div className="flex flex-col justify-center h-full leading-tight">
          <div className="text-sm font-medium text-slate-800 truncate">{d.nombre}</div>
          <div className="text-[11px] text-slate-400">{d.codigo}</div>
        </div>
      ),
    },
    { colId: 'marca',     field: 'marca',     headerName: 'Marca',     width: 88, cellStyle: { color: '#475569', fontSize: '12px' } },
    { colId: 'unidad',    field: 'unidad',    headerName: 'Unidad',    width: 72, cellStyle: { textAlign: 'center', color: '#64748b', fontSize: '12px' } },
    { colId: 'total',     field: 'total',     headerName: 'Total',     width: 60, cellStyle: { textAlign: 'center', color: '#64748b', fontWeight: '600' } },
    { colId: 'entregado', field: 'entregado', headerName: 'Entregado', width: 88, cellStyle: { textAlign: 'center', color: '#16a34a', fontWeight: '700' } },
    { colId: 'pendiente', field: 'pendiente', headerName: 'Pendiente', width: 88, cellStyle: { textAlign: 'center', color: '#ea580c', fontWeight: '700' } },
  ]

  const aProgramarCol: ColDef<FilaProducto>[] = includeAProgramar ? [
    {
      colId: 'cant_programar', field: 'cantAProgramar', headerName: aProgramarLabel, width: 128,
      cellStyle: { backgroundColor: '#f0fdf4' },
      cellRenderer: ({ data: d }: { data: FilaProducto }) => (
        <CantCell rowKey={d.key} init={d.cantAProgramar} max={d.pendiente} onCommit={onCommit} onChangeRef={onChangeRef} />
      ),
    },
  ] : []

  return [...baseCols, ...aProgramarCol]
}
