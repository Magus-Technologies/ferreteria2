'use client'

import { ColDef } from 'ag-grid-community'
import { useMemo } from 'react'
import { useClientesConDeuda, type VentaDeuda } from '../../_hooks/use-clientes-con-deuda'
import { useStoreClienteSeleccionado } from '../../store/store-cliente-seleccionado'
import TableWithTitle from '~/components/tables/table-with-title'
import { formatFechaPeru } from '~/utils/fechas'
import { orangeColors } from '~/lib/colors'

export default function TableDetalleDeudaCliente() {
  const cliente = useStoreClienteSeleccionado(s => s.cliente)
  const clientesDeudaMap = useClientesConDeuda()

  const ventas: VentaDeuda[] = useMemo(() => {
    if (!cliente?.id) return []
    return clientesDeudaMap.get(cliente.id)?.ventas ?? []
  }, [cliente?.id, clientesDeudaMap])

  const columnDefs = useMemo<ColDef<VentaDeuda>[]>(() => [
    {
      headerName: 'Documento',
      colId: 'doc',
      minWidth: 130,
      flex: 1,
      valueGetter: p => `${p.data?.serie}-${p.data?.numero}`,
    },
    {
      headerName: 'Fecha',
      field: 'fecha',
      minWidth: 120,
      flex: 1,
      valueFormatter: p => p.value ? formatFechaPeru(p.value, 'DD/MM/YYYY') : '-',
    },
    {
      headerName: 'F. Vencimiento',
      field: 'fecha_vencimiento',
      minWidth: 140,
      flex: 1,
      valueFormatter: p => p.value ? formatFechaPeru(p.value, 'DD/MM/YYYY') : 'Sin fecha',
    },
    {
      headerName: 'Total',
      field: 'total',
      minWidth: 110,
      flex: 1,
      valueFormatter: p => `S/. ${Number(p.value ?? 0).toFixed(2)}`,
    },
    {
      headerName: 'Cobrado',
      field: 'cobrado',
      minWidth: 110,
      flex: 1,
      cellStyle: { color: '#059669' } as Record<string, string>,
      valueFormatter: p => `S/. ${Number(p.value ?? 0).toFixed(2)}`,
    },
    {
      headerName: 'Resta',
      field: 'resta',
      minWidth: 120,
      flex: 1,
      cellStyle: { color: '#dc2626', fontWeight: 'bold' } as Record<string, string>,
      valueFormatter: p => `S/. ${Number(p.value ?? 0).toFixed(2)}`,
    },
    {
      headerName: 'Estado',
      colId: 'estado',
      minWidth: 150,
      flex: 1.2,
      cellRenderer: ({ data }: { data?: VentaDeuda }) => {
        if (!data) return null
        if (data.vencida) {
          return (
            <div className='flex items-center justify-center h-full'>
              <span className='bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold'>
                Vencido {data.diasMora}d
              </span>
            </div>
          )
        }
        if (data.diasFaltantes === null) {
          return <span className='text-gray-400 text-xs'>Sin fecha</span>
        }
        if (data.diasFaltantes === 0) {
          return (
            <div className='flex items-center justify-center h-full'>
              <span className='bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold'>
                Vence hoy
              </span>
            </div>
          )
        }
        const color = data.diasFaltantes <= 3
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-green-100 text-green-700'
        return (
          <div className='flex items-center justify-center h-full'>
            <span className={`${color} px-2 py-0.5 rounded-full text-xs font-bold`}>
              Faltan {data.diasFaltantes}d
            </span>
          </div>
        )
      },
    },
  ], [])

  const titulo = cliente
    ? `Detalle de Deuda — ${cliente.razon_social || `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim()}`
    : 'Detalle de Deuda'

  return (
    <div className='h-[220px] w-full'>
      <TableWithTitle<VentaDeuda>
        id='mis-ventas.detalle-deuda-cliente'
        title={titulo}
        selectionColor={orangeColors[10]}
        columnDefs={columnDefs}
        rowData={ventas}
      />
    </div>
  )
}
