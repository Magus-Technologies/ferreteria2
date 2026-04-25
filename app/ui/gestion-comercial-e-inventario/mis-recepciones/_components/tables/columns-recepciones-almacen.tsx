'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getNroDocCompra } from '~/app/_utils/get-nro-doc'
import ColumnAction from '~/components/tables/column-action'
import { TiposDocumentos } from '~/lib/docs'
import { permissions } from '~/lib/permissions'
import { Tooltip } from 'antd'
import { recepcionAlmacenApi, type RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'
import { HiDocumentText } from 'react-icons/hi2'
import { FaUndo } from 'react-icons/fa'
import { formatFechaPeru } from '~/utils/fechas'

const eliminarRecepcionAction = async ({ id }: { id: number }) => {
  const res = await recepcionAlmacenApi.delete(id)
  if (res.error) {
    return { error: { message: res.error.message } }
  }
  return { data: res.data }
}

export function useColumnsRecepcionesAlmacen({
  setDataModalDocRecepcionAlmacen,
  setOpenModalDocRecepcionAlmacen,
}: {
  setDataModalDocRecepcionAlmacen: (
    data: RecepcionAlmacenResponse | undefined
  ) => void
  setOpenModalDocRecepcionAlmacen: (open: boolean) => void
}) {
  const columns: ColDef<RecepcionAlmacenResponse>[] = [
    {
      colId: 'numero',
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
      }: ICellRendererParams<RecepcionAlmacenResponse>) => {
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
      colId: 'fecha',
      headerName: 'Fecha',
      field: 'fecha',
      width: 180,
      minWidth: 180,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
    },
    {
      colId: 'registrador',
      headerName: 'Registrador',
      field: 'user.name',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      colId: 'proveedor',
      headerName: 'Proveedor',
      width: 200,
      minWidth: 200,
      filter: true,
      valueGetter: ({ data }) =>
        data?.compra?.proveedor?.razon_social ??
        data?.orden_compra?.proveedor?.razon_social ??
        '',
      flex: 1,
    },
    {
      colId: 'compra_orden',
      headerName: 'Compra / Orden',
      width: 90,
      minWidth: 90,
      filter: true,
      valueGetter: ({ data }) =>
        data?.compra
          ? getNroDocCompra({ compra: data.compra })
          : (data?.orden_compra?.codigo ?? ''),
    },
    {
      colId: 'estado',
      headerName: 'Activo',
      field: 'estado',
      width: 90,
      type: 'boolean',
    },
    {
      colId: 'es_finalizacion',
      headerName: 'Finalización',
      field: 'es_finalizacion',
      width: 100,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<RecepcionAlmacenResponse>) => {
        if (!params.value) return null
        return (
          <div className='flex items-center h-full'>
            <span className='px-2 py-0.5 text-xs font-semibold rounded bg-orange-50 text-orange-700 border border-orange-200'>
              Finalizada
            </span>
          </div>
        )
      },
      filter: true,
    },
    {
      colId: 'motivo_finalizacion',
      headerName: 'Motivo de Finalización',
      field: 'motivo_finalizacion',
      width: 250,
      minWidth: 200,
      filter: true,
      cellRenderer: (params: ICellRendererParams<RecepcionAlmacenResponse>) => {
        if (!params.value) return <span className='text-gray-400'>—</span>
        return (
          <Tooltip title={params.value}>
            <div className='truncate text-sm'>
              {params.value}
            </div>
          </Tooltip>
        )
      },
    },
    {
      colId: 'fecha_finalizacion',
      headerName: 'Fecha Finalización',
      field: 'fecha_finalizacion',
      width: 150,
      minWidth: 150,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm A')
      },
      cellRenderer: (params: ICellRendererParams<RecepcionAlmacenResponse>) => {
        if (!params.value) return <span className='text-gray-400'>—</span>
        return (
          <div className='text-sm'>
            {formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm A')}
          </div>
        )
      },
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      pinned: 'right',
      cellRenderer: (
        params: ICellRendererParams<RecepcionAlmacenResponse>
      ) => {
        return params.data?.estado ? (
          <ColumnAction
            id={params.value}
            permiso={permissions.RECEPCION_ALMACEN_BASE}
            titleDelete='Deshacer'
            iconDelete={<FaUndo size={15} />}
            propsDelete={{
              action: eliminarRecepcionAction,
              msgSuccess: 'Recepción deshecha correctamente',
              queryKey: [QueryKeys.RECEPCIONES_ALMACEN],
            }}
            showEdit={false}
          >
            <Tooltip title='Ver Documento'>
              <HiDocumentText
                onClick={() => {
                  setDataModalDocRecepcionAlmacen(params.data)
                  setOpenModalDocRecepcionAlmacen(true)
                }}
                className='cursor-pointer hover:scale-110 transition-all text-amber-600'
                size={17}
              />
            </Tooltip>
          </ColumnAction>
        ) : null
      },
      type: 'actions',
    },
  ]

  return columns
}
