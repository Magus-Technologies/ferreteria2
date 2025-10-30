'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import {
  eliminarRecepcionAlmacen,
  getRecepcionesAlmacenResponseProps,
} from '~/app/_actions/recepcion-almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getNroDocCompra } from '~/app/_utils/get-nro-doc'
import ColumnAction from '~/components/tables/column-action'
import { TiposDocumentos } from '~/lib/docs'
import { permissions } from '~/lib/permissions'

export function useColumnsRecepcionesAlmacen({
  setDataModalDocRecepcionAlmacen,
  setOpenModalDocRecepcionAlmacen,
}: {
  setDataModalDocRecepcionAlmacen: (
    data: getRecepcionesAlmacenResponseProps | undefined
  ) => void
  setOpenModalDocRecepcionAlmacen: (open: boolean) => void
}) {
  const columns: ColDef<getRecepcionesAlmacenResponseProps>[] = [
    {
      headerName: 'N° Documento',
      field: 'numero',
      width: 90,
      minWidth: 90,
      valueFormatter: ({ value }) =>
        `${TiposDocumentos.RecepcionAlmacen.cod_serie}01-${value
          .toString()
          .padStart(4, '0')}`,
      cellRenderer: ({
        value,
        data,
      }: ICellRendererParams<getRecepcionesAlmacenResponseProps>) => {
        return (
          <div
            className='cursor-pointer text-sky-500 hover:underline hover:text-sky-700 transition-colors'
            onClick={() => {
              setDataModalDocRecepcionAlmacen(data)
              setOpenModalDocRecepcionAlmacen(true)
            }}
          >
            {`${TiposDocumentos.RecepcionAlmacen.cod_serie}01-${value
              .toString()
              .padStart(4, '0')}`}
          </div>
        )
      },
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 90,
      minWidth: 90,
      type: 'date',
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'Registrador',
      field: 'user.name',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'Proveedor',
      field: 'compra',
      width: 200,
      minWidth: 200,
      filter: true,
      valueFormatter: ({ value }) => value.proveedor.razon_social,
      flex: 1,
    },
    {
      headerName: 'Compra',
      field: 'compra',
      width: 90,
      minWidth: 90,
      filter: true,
      valueFormatter: ({ value }) => getNroDocCompra({ compra: value }),
    },
    {
      headerName: 'Activo',
      field: 'estado',
      width: 90,
      type: 'boolean',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (
        params: ICellRendererParams<getRecepcionesAlmacenResponseProps>
      ) => {
        return params.data?.estado ? (
          <ColumnAction
            id={params.value}
            permiso={permissions.RECEPCION_ALMACEN_BASE}
            propsDelete={{
              action: eliminarRecepcionAlmacen,
              msgSuccess: 'Recepción eliminada correctamente',
              queryKey: [QueryKeys.RECEPCIONES_ALMACEN],
            }}
            showEdit={false}
          />
        ) : null
      },
      type: 'actions',
    },
  ]

  return columns
}
