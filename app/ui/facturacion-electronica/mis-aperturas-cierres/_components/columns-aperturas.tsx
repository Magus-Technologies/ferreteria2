import { ColDef } from 'ag-grid-community'
import { AperturaYCierreCaja } from '~/lib/api/caja'
import { Button, Tag, Tooltip } from 'antd'
import { FaFilePdf, FaRotateLeft } from 'react-icons/fa6'
import { formatFechaPeru } from '~/utils/fechas'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

const centerCell = { display: 'flex', alignItems: 'center', justifyContent: 'center' }

export const useColumnsAperturas = ({
  onVerTicket,
  onDeshacer,
}: {
  onVerTicket: (apertura: AperturaYCierreCaja) => void
  onDeshacer?: (apertura: AperturaYCierreCaja) => void
}): ColDef<AperturaYCierreCaja>[] => {
  return [
    {
      colId: 'fecha_apertura',
      headerName: 'Fecha Apertura',
      field: 'fecha_apertura',
      width: 180,
      minWidth: 130,
      cellStyle: centerCell,
      cellRenderer: (params: any) => formatFechaPeru(params.value),
    },
    {
      colId: 'vendedor',
      // Sin centrado — texto izquierda por defecto
      headerName: 'Vendedor',
      field: 'vendedor',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: any) => {
        const user = params.value
        return (
          <div>
            <div className='font-medium text-slate-700'>{user?.name || '-'}</div>
            <div className='text-xs text-slate-500'>{user?.email || ''}</div>
          </div>
        )
      },
    },
    {
      colId: 'caja',
      // Sin centrado — texto izquierda por defecto
      headerName: 'Caja',
      field: 'caja_principal',
      width: 150,
      minWidth: 80,
      cellRenderer: (params: any) => params.value?.nombre,
    },
    {
      colId: 'monto_apertura',
      headerName: 'Monto Apertura',
      field: 'monto_apertura',
      width: 150,
      minWidth: 100,
      cellStyle: centerCell,
      cellRenderer: (params: any) => (
        <span className='font-semibold text-green-600'>
          {formatCurrency(parseFloat(params.value))}
        </span>
      ),
    },
    {
      colId: 'desglose_apertura',
      headerName: 'Desglose (Asignado / Manual)',
      field: 'monto_apertura_asignado',
      width: 200,
      minWidth: 160,
      cellStyle: centerCell,
      cellRenderer: (params: any) => {
        const asignado = parseFloat(params.data?.monto_apertura_asignado ?? '0')
        const manual = parseFloat(params.data?.monto_apertura_manual ?? '0')
        if (asignado <= 0) {
          return <span className='text-slate-400 text-xs'>—</span>
        }
        return (
          <div className='leading-tight text-xs'>
            <div className='text-emerald-600 font-semibold'>Asignado: {formatCurrency(asignado)}</div>
            <div className='text-slate-600'>Manual: {formatCurrency(manual)}</div>
          </div>
        )
      },
    },
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      minWidth: 90,
      cellStyle: centerCell,
      cellRenderer: (params: any) => (
        <Tag color={params.value === 'abierta' ? 'green' : 'blue'}>
          {params.value === 'abierta' ? 'ABIERTA' : 'CERRADA'}
        </Tag>
      ),
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'id',
      width: 140,
      pinned: 'right',
      cellStyle: centerCell,
      cellRenderer: (params: any) => {
        const isAbierta = params.data?.estado === 'abierta'
        return (
          <div className='flex gap-1 items-center justify-center'>
            <Tooltip title='Ver Ticket de Apertura'>
              <Button
                type='link'
                size='small'
                className='flex items-center gap-1'
                onClick={() => onVerTicket(params.data)}
              >
                <FaFilePdf className='text-red-600 text-lg' />
              </Button>
            </Tooltip>
            {isAbierta && onDeshacer && (
              <Tooltip title='Deshacer apertura'>
                <Button
                  type='link'
                  size='small'
                  className='flex items-center gap-1'
                  onClick={() => onDeshacer(params.data)}
                >
                  <FaRotateLeft className='text-amber-600 text-lg' />
                </Button>
              </Tooltip>
            )}
          </div>
        )
      },
    },
  ]
}