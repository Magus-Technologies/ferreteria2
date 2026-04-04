import { ColDef } from 'ag-grid-community'

interface Usuario {
  id: string
  name: string
  numero_documento: string
  rol_sistema: string
  email: string
  celular: string | null
}

export function useColumnsDespachadores(): ColDef<Usuario>[] {
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
      colId: 'numero_documento',
      headerName: 'DNI/RUC',
      field: 'numero_documento',
      width: 120,
      pinned: 'left',
    },
    {
      colId: 'nombre',
      headerName: 'Nombre Completo',
      field: 'name',
      width: 300,
      pinned: 'left',
    },
    {
      colId: 'email',
      headerName: 'Email',
      field: 'email',
      width: 250,
    },
    {
      colId: 'celular',
      headerName: 'Celular',
      field: 'celular',
      width: 150,
    },
  ]
}
