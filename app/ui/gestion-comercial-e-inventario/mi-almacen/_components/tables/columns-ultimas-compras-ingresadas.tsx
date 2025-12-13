import { ColDef } from 'ag-grid-community'
import type { getProductosResponseProps } from '~/app/_actions/producto'

export type UltimasComprasType = Pick<
  getProductosResponseProps['producto_en_almacenes'][number]['compras'][number],
  'compra' | 'costo'
> &
  getProductosResponseProps['producto_en_almacenes'][number]['compras'][number]['unidades_derivadas'][number] & {
  bonificacion?: boolean
  compra: {
    tipo_documento: string
    serie: string | null
    numero: number | null
    fecha: Date
    proveedor: {
      razon_social: string
    }
    user: {
      name: string | null
    }
  }
}

export function useColumnsUltimasComprasIngresadas() {
  const columns: ColDef<UltimasComprasType>[] = [
    {
      headerName: 'Documento',
      field: 'compra.tipo_documento',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'Serie',
      field: 'compra.serie',
      width: 60,
      minWidth: 60,
      filter: true,
    },
    {
      headerName: 'Número',
      field: 'compra.numero',
      width: 60,
      minWidth: 60,
      filter: true,
    },
    {
      headerName: 'Fecha',
      field: 'compra.fecha',
      width: 90,
      minWidth: 90,
      type: 'date',
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'Razón Social',
      field: 'compra.proveedor.razon_social',
      width: 200,
      minWidth: 200,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Registrado por',
      field: 'compra.user.name',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'U. Derivada',
      field: 'unidad_derivada_inmutable.name',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 50,
      minWidth: 50,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Precio',
      field: 'costo',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      type: 'pen4',
      valueFormatter: ({ data }: { data: UltimasComprasType | undefined }) =>
        data?.bonificacion
          ? '0'
          : String(Number(data?.costo ?? 0) * Number(data?.factor ?? 1)),
    },
    {
      headerName: 'Subtotal',
      field: 'costo',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      type: 'pen4',
      valueFormatter: ({ data }: { data: UltimasComprasType | undefined }) =>
        data?.bonificacion
          ? '0'
          : String(
              Number(data?.costo ?? 0) *
                Number(data?.factor ?? 1) *
                Number(data?.cantidad ?? 0)
            ),
    },
  ]

  return columns
}
