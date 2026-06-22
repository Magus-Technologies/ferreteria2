'use client'

import type { ColDef } from 'ag-grid-community'
import type { ProductoEntrega } from '../../../../../_hooks/use-productos-entrega'
import { ProgramarCell } from './programar-cell'

/**
 * Column defs para la tabla de productos del modo **Domicilio**.
 *
 * En Domicilio NO existe la columna "Entrega ahora" — todo se programa.
 * Solo "Programar ahora" es editable; "Pendiente sin programar" se calcula
 * como `total - entregar_programado` y queda como pendiente sin tocar.
 *
 * Recibe el handler como factory porque el handler vive en el caller
 * (componente principal o sección) y captura state propio. Este archivo
 * mantiene la definición visual de las columnas, no la lógica de negocio.
 */
export function makeColumnsDomicilio(
  onProgramarChange: (id: number, value: number | null) => void,
  onExcluir?: (id: number) => void,
  showRecibido = false,
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
    ...(showRecibido ? [{
      headerName: 'Devolvió',
      field: 'recibido' as keyof ProductoEntrega,
      width: 110,
      valueFormatter: (params: { value: unknown }) => Number(params.value || 0).toFixed(2),
      cellStyle: { textAlign: 'center', color: '#dc2626', fontWeight: '700' } as Record<string, string>,
    } as ColDef<ProductoEntrega>] : []),
    {
      headerName: 'Programar ahora',
      field: 'entregar_programado',
      width: 150,
      cellRenderer: (params: { data?: ProductoEntrega }) => {
        if (!params.data) return null
        return (
          <ProgramarCell
            id={params.data.id}
            initialValue={params.data.entregar_programado}
            max={params.data.total}
            onCommit={onProgramarChange}
          />
        )
      },
      cellStyle: { backgroundColor: '#f0fdf4' } as Record<string, string>,
    },
    {
      headerName: 'Pendiente sin programar',
      colId: 'pendiente-sin-programar',
      width: 180,
      valueGetter: (params) => {
        if (!params.data) return 0
        return Math.max(0, params.data.total - params.data.entregar_programado)
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
    ...(onExcluir
      ? [{
          headerName: '',
          colId: 'excluir',
          width: 50,
          sortable: false,
          filter: false,
          cellRenderer: (params: { data?: ProductoEntrega }) => (
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => params.data && onExcluir(params.data.id)}
            >
              ❌
            </span>
          ),
          cellStyle: { textAlign: 'center' } as Record<string, string>,
        } as ColDef<ProductoEntrega>]
      : []),
  ]
}
