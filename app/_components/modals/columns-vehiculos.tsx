import { ColDef } from 'ag-grid-community'
import type { Vehiculo } from '~/lib/api/catalogos'

export function useColumnsVehiculos(): ColDef<Vehiculo>[] {
  return [
    {
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      width: 70,
      pinned: 'left',
      suppressMovable: true,
      lockPosition: 'left',
    },
    {
      headerName: 'Nombre',
      field: 'name',
      width: 200,
      pinned: 'left',
    },
    {
      headerName: 'Tipo',
      field: 'tipo',
      width: 120,
    },
    {
      headerName: 'Marca/Modelo',
      field: 'marca_modelo',
      width: 180,
      valueFormatter: (p) => p.value || '—',
    },
    {
      headerName: 'Placa',
      field: 'placa',
      width: 120,
      valueFormatter: (p) => p.value || '—',
    },
  ]
}
