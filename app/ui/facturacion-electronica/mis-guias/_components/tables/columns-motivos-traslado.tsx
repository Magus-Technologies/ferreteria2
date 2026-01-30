'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { motivoTrasladoApi, type MotivoTraslado } from '~/lib/api/motivo-traslado'

export function useColumnsMotivosTraslado({
  setDataEdit,
  setOpen,
}: {
  setDataEdit: (data: MotivoTraslado | undefined) => void
  setOpen: (open: boolean) => void
}) {
  const columns: ColDef<MotivoTraslado>[] = [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 100,
      minWidth: 100,
      filter: true,
    },
    {
      headerName: 'Descripción',
      field: 'descripcion',
      width: 400,
      minWidth: 400,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Activo',
      field: 'activo',
      width: 90,
      minWidth: 90,
      type: 'boolean',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (params: ICellRendererParams<MotivoTraslado>) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.GUIA_BASE}
            propsDelete={{
              action: async ({ id }: { id: number }) => {
                const result = await motivoTrasladoApi.delete(id)
                if (result.error) {
                  return { error: result.error }
                }
                return { data: 'ok' }
              },
              msgSuccess: 'Motivo de traslado eliminado correctamente',
              queryKey: [QueryKeys.MOTIVOS_TRASLADO],
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
