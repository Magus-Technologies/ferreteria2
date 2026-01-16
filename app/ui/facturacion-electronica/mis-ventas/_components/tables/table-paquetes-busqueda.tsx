'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import type { Paquete } from '~/lib/api/paquete'
import { useState } from 'react'
import { usePaquetes } from '~/hooks/use-paquetes'
import { useDebounce } from 'use-debounce'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ModalCrearEditarPaquete from '~/app/_components/modals/modal-crear-editar-paquete'
import { orangeColors } from '~/lib/colors'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { paqueteApi } from '~/lib/api/paquete'

interface TablePaquetesBusquedaProps
  extends Omit<
    TableWithTitleProps<Paquete>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Paquete | undefined
  }) => void
  onPaqueteSeleccionado?: (paquete: Paquete | undefined) => void
}

export default function TablePaquetesBusqueda({
  value,
  onRowDoubleClicked,
  onPaqueteSeleccionado,
  ...props
}: TablePaquetesBusquedaProps) {
  const [debouncedValue] = useDebounce(value, 500)

  // Siempre buscar, incluso con string vacío
  const { data, isLoading } = usePaquetes({
    search: debouncedValue || undefined, // undefined para que no filtre
    activo: true,
    per_page: 50,
  })

  const [openModalEditar, setOpenModalEditar] = useState(false)
  const [paqueteParaEditar, setPaqueteParaEditar] = useState<Paquete>()

  const columnDefs: ColDef<Paquete>[] = [
    {
      headerName: 'Nombre',
      field: 'nombre',
      flex: 2,
      cellClass: 'font-medium',
      filter: true,
    },
    {
      headerName: 'Productos',
      field: 'productos_count',
      width: 120,
      cellClass: 'text-center',
      filter: true,
      cellRenderer: (params: any) => {
        const count = params.data?.productos_count || params.data?.productos?.length || 0
        return (
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            {count} producto{count !== 1 ? 's' : ''}
          </span>
        )
      },
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (params: ICellRendererParams<Paquete>) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.CLIENTE_BASE} // TODO: Cambiar por permiso de paquetes cuando esté implementado
            propsDelete={{
              action: async ({ id }: { id: number }) => {
                const result = await paqueteApi.delete(id)
                if (result.error) {
                  return { error: result.error }
                }
                return { data: 'ok' }
              },
              msgSuccess: 'Paquete eliminado correctamente',
              queryKey: [QueryKeys.PAQUETES],
            }}
            onEdit={() => {
              setPaqueteParaEditar(params.data)
              setOpenModalEditar(true)
            }}
          />
        )
      },
      type: 'actions',
    },
  ]

  return (
    <>
      <ModalCrearEditarPaquete
        open={openModalEditar}
        onClose={() => {
          setOpenModalEditar(false)
          setPaqueteParaEditar(undefined)
        }}
        paqueteId={paqueteParaEditar?.id}
        onSuccess={() => {
          // React Query invalidará el cache automáticamente
        }}
      />
      
      <TableWithTitle<Paquete>
        {...props}
        id='mis-ventas.paquetes'
        title='Paquetes'
        selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
        loading={isLoading}
        columnDefs={columnDefs}
        rowData={data?.data || []}
        onSelectionChanged={({ selectedNodes }) => {
          const paquete = selectedNodes?.[0]?.data as Paquete
          onPaqueteSeleccionado?.(paquete)
        }}
        onRowDoubleClicked={({ data }) => {
          onPaqueteSeleccionado?.(data)
          onRowDoubleClicked?.({ data })
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              'Nombre',
              'Productos',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}

