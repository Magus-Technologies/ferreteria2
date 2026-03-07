'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { clienteApi, Cliente } from '~/lib/api/cliente'
import type { DeudaCliente } from '../../_hooks/use-clientes-con-deuda'

export function useColumnsClientes({
  setDataEdit,
  setOpen,
  clientesDeudaMap,
}: {
  setDataEdit: (data: Cliente | undefined) => void
  setOpen: (open: boolean) => void
  clientesDeudaMap?: Map<number, DeudaCliente>
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
      headerName: 'Razon Social / Nombres',
      field: 'razon_social',
      width: 250,
      minWidth: 200,
      filter: true,
      flex: 1,
      valueGetter: (params) => {
        if (params.data?.razon_social) return params.data.razon_social
        return `${params.data?.nombres} ${params.data?.apellidos}`
      },
    },
    {
      headerName: 'Direccion',
      field: 'direcciones',
      width: 120,
      minWidth: 120,
      valueGetter: (params) => {
        const direcciones = params.data?.direcciones;
        if (!direcciones || direcciones.length === 0) return '-';
        const principal = direcciones.find(d => d.es_principal);
        return principal?.direccion || direcciones[0]?.direccion || '-';
      },
      filter: true,
    },
    {
      headerName: 'Telefono',
      field: 'telefono',
      width: 100,
      minWidth: 100,
      valueFormatter: (params) => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Deuda',
      field: 'id',
      colId: 'deuda',
      width: 110,
      minWidth: 110,
      cellRenderer: (params: ICellRendererParams<Cliente>) => {
        if (!clientesDeudaMap || !params.data) return <span className='text-gray-400'>-</span>
        const deuda = clientesDeudaMap.get(params.data.id)
        if (!deuda) return <span className='text-green-600 text-xs font-medium'>Sin deuda</span>
        return (
          <div className='flex items-center h-full'>
            <span className='text-red-600 font-bold text-xs'>
              S/. {deuda.totalDeuda.toFixed(2)}
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'Ventas Pend.',
      field: 'id',
      colId: 'ventas_pendientes',
      width: 100,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<Cliente>) => {
        if (!clientesDeudaMap || !params.data) return <span className='text-gray-400'>-</span>
        const deuda = clientesDeudaMap.get(params.data.id)
        if (!deuda) return <span className='text-gray-400'>-</span>
        return (
          <div className='flex items-center justify-center h-full'>
            <span className='bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold'>
              {deuda.cantidadVentas}
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'Dias Mora',
      field: 'id',
      colId: 'dias_mora',
      width: 95,
      minWidth: 95,
      cellRenderer: (params: ICellRendererParams<Cliente>) => {
        if (!clientesDeudaMap || !params.data) return <span className='text-gray-400'>-</span>
        const deuda = clientesDeudaMap.get(params.data.id)
        if (!deuda) return <span className='text-gray-400'>-</span>

        const dias = deuda.diasMaxMora
        let colorClass = 'text-yellow-600 bg-yellow-100'
        if (dias > 30) colorClass = 'text-red-600 bg-red-100'
        else if (dias > 15) colorClass = 'text-orange-600 bg-orange-100'

        return (
          <div className='flex items-center justify-center h-full'>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
              {dias}d
            </span>
          </div>
        )
      },
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
                if (result.error) {
                  return { error: result.error }
                }
                return { data: 'ok' }
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
