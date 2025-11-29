'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import {
  eliminarCliente,
  getClienteResponseProps,
} from '~/app/_actions/cliente'

export function useColumnsClientes({
  setDataEdit,
  setOpen,
}: {
  setDataEdit: (data: getClienteResponseProps | undefined) => void
  setOpen: (open: boolean) => void
}) {
  const columns: ColDef<getClienteResponseProps>[] = [
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
      valueGetter: params => {
          if (params.data?.razon_social) return params.data.razon_social
          return `${params.data?.nombres} ${params.data?.apellidos}`
      }
    },
    {
      headerName: 'Dirección',
      field: 'direccion',
      width: 120,
      minWidth: 120,
      valueFormatter: params => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Teléfono',
      field: 'telefono',
      width: 120,
      minWidth: 120,
      valueFormatter: params => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 120,
      minWidth: 120,
      valueFormatter: params => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (
        params: ICellRendererParams<getClienteResponseProps>
      ) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.CLIENTE_DELETE}
            propsDelete={{
              action: eliminarCliente,
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
