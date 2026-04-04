import { ColDef } from 'ag-grid-community'
import type { Vehiculo } from '~/lib/api/catalogos'

export function useColumnsVehiculos(): ColDef<Vehiculo>[] {
  return [
    {
      colId: 'numero_fila',
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      width: 70,
      pinned: 'left',
      suppressMovable: true,
      lockPosition: 'left',
    },
    {
      colId: 'nombre',
      headerName: 'Nombre',
      field: 'name',
      width: 200,
      pinned: 'left',
    },
    {
      colId: 'tipo',
      headerName: 'Tipo',
      field: 'tipo',
      width: 120,
    },
    {
      colId: 'marca_modelo',
      headerName: 'Marca/Modelo',
      field: 'marca_modelo',
      width: 180,
      valueFormatter: (p) => p.value || '—',
    },
    {
      colId: 'placa',
      headerName: 'Placa',
      field: 'placa',
      width: 120,
      valueFormatter: (p) => p.value || '—',
    },
  ]
}
