import { ColDef } from 'ag-grid-community'

interface UltimasComprasIngresadasProps {
  documento: string
  serie: string
  numero: string
  fecha: string
  razon_social: string
  registrado_por: string
  cantidad: number
  unidad_de_medida: string
  precio: number
  subtotal: number
}

export function useColumnsUltimasComprasIngresadas() {
  const columns: ColDef<UltimasComprasIngresadasProps>[] = [
    {
      headerName: 'Documento',
      field: 'documento',
      minWidth: 80,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Serie',
      field: 'serie',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Número',
      field: 'numero',
      minWidth: 80,
      filter: true,
      flex: 1,
      hide: true,
    },
    {
      headerName: 'Fecha',
      field: 'fecha',
      minWidth: 90,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Razón Social',
      field: 'razon_social',
      minWidth: 180,
      filter: true,
      flex: 3,
    },
    {
      headerName: 'Registrado por',
      field: 'registrado_por',
      minWidth: 180,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
    },
    {
      headerName: 'U. Medida',
      field: 'unidad_de_medida',
      minWidth: 80,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Precio',
      field: 'precio',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
  ]

  return columns
}
