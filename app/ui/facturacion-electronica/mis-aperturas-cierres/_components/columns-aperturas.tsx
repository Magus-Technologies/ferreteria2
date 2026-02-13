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

export const useColumnsAperturas = ({
  onVerTicket,
}: {
  onVerTicket: (apertura: AperturaYCierreCaja) => void
}): ColDef<AperturaYCierreCaja>[] => {
  return [
    {
      headerName: 'Fecha Apertura',
      field: 'fecha_apertura',
      width: 180,
      cellRenderer: (params: any) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
    {
      headerName: 'Usuario',
      field: 'user',
      width: 180,
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
      headerName: 'Caja',
      field: 'sub_caja',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const subCaja = params.value
        return (
          <div>
            <div className='font-medium'>{subCaja?.nombre}</div>
            <div className='text-xs text-slate-500'>{subCaja?.codigo}</div>
          </div>
        )
      },
    },
    {
      headerName: 'Caja Principal',
      field: 'caja_principal',
      flex: 1,
      minWidth: 180,
      cellRenderer: (params: any) => params.value?.nombre,
    },
    {
      headerName: 'Monto Apertura',
      field: 'monto_apertura',
      width: 150,
      cellRenderer: (params: any) => (
        <div className='text-right font-semibold text-green-600'>
          {formatCurrency(parseFloat(params.value))}
        </div>
      ),
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      cellRenderer: (params: any) => (
        <div className='flex justify-center'>
          <Tag color={params.value === 'abierta' ? 'green' : 'blue'}>
            {params.value === 'abierta' ? 'ABIERTA' : 'CERRADA'}
          </Tag>
        </div>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 100,
      pinned: 'right',
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
        );
      },
    },
  ]
}
