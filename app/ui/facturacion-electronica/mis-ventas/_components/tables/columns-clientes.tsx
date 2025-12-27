'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { clienteApi, Cliente } from '~/lib/api/cliente'

export function useColumnsClientes({
  setDataEdit,
  setOpen,
}: {
  setDataEdit: (data: Cliente | undefined) => void
  setOpen: (open: boolean) => void
}) {
  const columns: ColDef<Cliente>[] = [
    {
      headerName: 'Documento',
      field: 'numero_documento',
      width: 120,
      minWidth: 120,
      filter: true,
    },
    {
      headerName: 'Razón Social / Nombres',
      field: 'razon_social',
      width: 300,
      minWidth: 300,
      filter: true,
      flex: 1,
      valueGetter: (params) => {
        if (params.data?.razon_social) return params.data.razon_social
        return `${params.data?.nombres} ${params.data?.apellidos}`
      },
    },
    {
      headerName: 'Dirección',
      field: 'direccion',
      width: 120,
      minWidth: 120,
      valueFormatter: (params) => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Teléfono',
      field: 'telefono',
      width: 120,
      minWidth: 120,
      valueFormatter: (params) => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 120,
      minWidth: 120,
      valueFormatter: (params) => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (params: ICellRendererParams<Cliente>) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.CLIENTE_BASE}
            propsDelete={{
              action: async ({ id }: { id: number }) => {
                const result = await clienteApi.delete(id)
                if (result.error) throw new Error(result.error.message)
                return result
              },
              msgSuccess: 'Cliente eliminado correctamente',
              queryKey: [QueryKeys.CLIENTES, QueryKeys.CLIENTES_SEARCH],
            }}
            onEdit={() => {
              setDataEdit(params.data)
              setOpen(true)
            }}
          />
        )
      },
      type: 'actions',
    },
  ]

  return columns
}
