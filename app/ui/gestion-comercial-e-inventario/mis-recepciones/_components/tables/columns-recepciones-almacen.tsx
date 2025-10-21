'use client'

import { ColDef } from 'ag-grid-community'
import { getRecepcionesAlmacenResponseProps } from '~/app/_actions/recepcion-almacen'
import { TiposDocumentos } from '~/lib/docs'

export function useColumnsRecepcionesAlmacen() {
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
  ]

  return columns
}
