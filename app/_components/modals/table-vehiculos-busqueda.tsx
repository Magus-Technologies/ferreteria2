'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { useColumnsVehiculos } from './columns-vehiculos'
import { useQuery } from '@tanstack/react-query'
import { vehiculosApi, type Vehiculo } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface TableVehiculosBusquedaProps
  extends Omit<
    TableWithTitleProps<Vehiculo>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: (vehiculo: Vehiculo | undefined) => void
}

export default function TableVehiculosBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableVehiculosBusquedaProps) {
  const { data: vehiculos = [], isLoading } = useQuery({
    queryKey: [QueryKeys.VEHICULOS, 'disponibles', value],
    queryFn: async () => {
      const response = await vehiculosApi.getAll({ estado: true, search: value || undefined })
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <TableWithTitle<Vehiculo>
      {...props}
      id='vehiculos-busqueda'
      title='Vehículos Disponibles'
      loading={isLoading}
      columnDefs={useColumnsVehiculos()}
      rowData={vehiculos}
      onRowDoubleClicked={({ data }) => {
        onRowDoubleClicked?.(data)
      }}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Nombre',
            'Tipo',
            'Marca/Modelo',
            'Placa',
          ],
        },
      ]}
    />
  )
}
