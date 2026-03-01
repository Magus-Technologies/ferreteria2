import { ColDef } from 'ag-grid-community'
import { AperturaYCierreCaja } from '~/lib/api/caja'
import { Button, Tag, Tooltip } from 'antd'
import { FaFilePdf } from 'react-icons/fa6'
import dayjs from 'dayjs'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

const centerCell = { display: 'flex', alignItems: 'center', justifyContent: 'center' }

export const useColumnsAperturas = ({
  onVerTicket,
}: {
  onVerTicket: (apertura: AperturaYCierreCaja) => void
}): ColDef<AperturaYCierreCaja>[] => {
  return [
    {
      headerName: 'Fecha Apertura',
      field: 'fecha_apertura',
      flex: 1,
      minWidth: 130,
      cellStyle: centerCell,
      cellRenderer: (params: any) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
    {
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
      // Sin centrado — texto izquierda por defecto
      headerName: 'Caja',
      field: 'caja_principal',
      flex: 1,
      minWidth: 80,
      cellRenderer: (params: any) => params.value?.nombre,
    },
    {
      headerName: 'Monto Apertura',
      field: 'monto_apertura',
      flex: 1,
      minWidth: 100,
      cellStyle: centerCell,
      cellRenderer: (params: any) => (
        <span className='font-semibold text-green-600'>
          {formatCurrency(parseFloat(params.value))}
        </span>
      ),
    },
    {
      headerName: 'Estado',
      field: 'estado',
      flex: 1,
      minWidth: 90,
      cellStyle: centerCell,
      cellRenderer: (params: any) => (
        <Tag color={params.value === 'abierta' ? 'green' : 'blue'}>
          {params.value === 'abierta' ? 'ABIERTA' : 'CERRADA'}
        </Tag>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 90,
      pinned: 'right',
      cellStyle: centerCell,
      cellRenderer: (params: any) => {
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
          </div>
        )
      },
    },
  ]
}