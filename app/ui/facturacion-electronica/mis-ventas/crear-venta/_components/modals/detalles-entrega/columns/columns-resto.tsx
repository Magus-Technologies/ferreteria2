'use client'

import type { ColDef } from 'ag-grid-community'
import type { ProductoEntrega } from '../../../../../_hooks/use-productos-entrega'
import { ProgramarCell } from './programar-cell'

/**
 * Column defs para la tabla del **Resto** (sub-sección de Parcial).
 *
 * Diferencias vs columnsDomicilio:
 *  - Muestra "Entrega ahora" (read-only) — se editó en la tabla principal de Parcial.
 *  - "Programar ahora" se limita a `total - entregar` (lo que quedó después de la
 *    parte que el cliente lleva ahora).
 *  - "Pendiente sin programar" se calcula `total - entregar - entregar_programado`.
 */
export function makeColumnsResto(
  onProgramarChange: (id: number, value: number | null) => void,
): ColDef<ProductoEntrega>[] {
  return [
    {
      headerName: 'Producto',
      field: 'producto',
      flex: 1,
    },
    {
      headerName: 'Total',
      field: 'total',
      width: 100,
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      headerName: 'Entrega ahora',
      field: 'entregar',
      width: 130,
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: { color: '#16a34a', fontWeight: 'bold' } as Record<string, string>,
    },
    {
      headerName: 'Programar ahora',
      field: 'entregar_programado',
      width: 150,
      cellRenderer: (params: { data?: ProductoEntrega }) => {
        if (!params.data) return null
        const maxProgramable = Math.max(0, params.data.total - params.data.entregar)
        return (
          <ProgramarCell
            id={params.data.id}
            initialValue={params.data.entregar_programado}
            max={maxProgramable}
            onCommit={onProgramarChange}
          />
        )
      },
      cellStyle: { backgroundColor: '#fff7ed' } as Record<string, string>,
    },
    {
      headerName: 'Pendiente sin programar',
      width: 180,
      valueGetter: (params) => {
        if (!params.data) return 0
        return Math.max(
          0,
          params.data.total - params.data.entregar - params.data.entregar_programado,
        )
      },
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: (params) => {
        const pendiente = params.value ?? 0
        return {
          color: pendiente > 0 ? '#dc2626' : '#9ca3af',
          fontWeight: 'bold',
        } as Record<string, string>
      },
    },
  ]
}
