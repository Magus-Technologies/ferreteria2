import { ColDef } from 'ag-grid-community'
import { AperturaYCierreCaja } from '~/lib/api/caja'
import { Tag } from 'antd'
import dayjs from 'dayjs'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

export const useColumnsAperturas = (): ColDef<AperturaYCierreCaja>[] => {
  return [
    {
      headerName: 'Fecha Apertura',
      field: 'fecha_apertura',
      width: 180,
      cellRenderer: (params: any) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
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
  ]
}
