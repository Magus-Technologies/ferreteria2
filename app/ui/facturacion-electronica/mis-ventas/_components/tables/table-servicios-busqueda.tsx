'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import type { Servicio } from '~/lib/api/servicios'
import { useServicios } from '~/hooks/use-servicios'
import { useDebounce } from 'use-debounce'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

interface TableServiciosBusquedaProps
  extends Omit<
    TableWithTitleProps<Servicio>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Servicio | undefined
  }) => void
  onServicioSeleccionado?: (servicio: Servicio | undefined) => void
}

export default function TableServiciosBusqueda({
  value,
  onRowDoubleClicked,
  onServicioSeleccionado,
  ...props
}: TableServiciosBusquedaProps) {
  const [debouncedValue] = useDebounce(value, 500)

  const { data, isLoading } = useServicios({
    search: debouncedValue || undefined,
    activo: true,
    per_page: 50,
  })

  const columnDefs: ColDef<Servicio>[] = [
    {
      headerName: 'Nombre',
      field: 'nombre',
      flex: 2,
      cellClass: 'font-medium',
      filter: true,
    },
    {
      headerName: 'Precio',
      field: 'precio',
      width: 130,
      filter: true,
      cellRenderer: (params: any) => {
        const precio = Number(params.value || 0)
        return (
          <div className='flex items-center h-full'>
            S/ {precio.toFixed(2)}
          </div>
        )
      },
    },
    {
      headerName: 'Cód. SUNAT',
      field: 'codigo_sunat',
      width: 140,
      filter: true,
      cellRenderer: (params: any) => (
        <div className='flex items-center h-full text-gray-500'>
          {params.value || '-'}
        </div>
      ),
    },
  ]

  return (
    <TableWithTitle<Servicio>
      {...props}
      id='mis-ventas.servicios'
      title='Servicios'
      selectionColor={orangeColors[10]}
      loading={isLoading}
      columnDefs={columnDefs}
      rowData={data?.data || []}
      onSelectionChanged={({ selectedNodes }) => {
        const servicio = selectedNodes?.[0]?.data as Servicio
        onServicioSeleccionado?.(servicio)
      }}
      onRowDoubleClicked={({ data }) => {
        onServicioSeleccionado?.(data)
        onRowDoubleClicked?.({ data })
      }}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            'Nombre',
            'Precio',
            'Cód. SUNAT',
          ],
        },
      ]}
    />
  )
}
