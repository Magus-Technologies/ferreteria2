'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import {
  eliminarProveedor,
  getProveedorResponseProps,
} from '~/app/_actions/proveedor'

export function useColumnsProveedores({
  setDataEdit,
  setOpen,
}: {
  setDataEdit: (data: getProveedorResponseProps | undefined) => void
  setOpen: (open: boolean) => void
}) {
  const columns: ColDef<getProveedorResponseProps>[] = [
    {
      headerName: 'RUC',
      field: 'ruc',
      width: 120,
      minWidth: 120,
      filter: true,
    },
    {
      headerName: 'Razón Social',
      field: 'razon_social',
      width: 300,
      minWidth: 300,
      filter: true,
      flex: 1,
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
      headerName: 'Activo',
      field: 'estado',
      width: 90,
      minWidth: 90,
      type: 'boolean',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (
        params: ICellRendererParams<getProveedorResponseProps>
      ) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.PRODUCTO_BASE}
            propsDelete={{
              action: eliminarProveedor,
              msgSuccess: 'Proveedor eliminado correctamente',
              queryKey: [QueryKeys.PROVEEDORES, QueryKeys.PROVEEDORES_SEARCH],
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
