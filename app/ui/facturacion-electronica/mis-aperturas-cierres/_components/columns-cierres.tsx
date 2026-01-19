import { ColDef } from 'ag-grid-community'
import { AperturaYCierreCaja } from '~/lib/api/caja'
import { Button, Tag, Tooltip } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

export const useColumnsCierres = ({
  onVerDetalles,
}: {
  onVerDetalles: (cierre: AperturaYCierreCaja) => void
}): ColDef<AperturaYCierreCaja>[] => {
  return [
    {
      headerName: 'Fecha Cierre',
      field: 'fecha_cierre',
      width: 180,
      cellRenderer: (params: any) => 
        params.value ? dayjs(params.value).format('DD/MM/YYYY HH:mm') : '-',
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
      headerName: 'Monto Apertura',
      field: 'monto_apertura',
      width: 150,
      cellRenderer: (params: any) => (
        <div className='text-right'>
          {formatCurrency(parseFloat(params.value))}
        </div>
      ),
    },
    {
      headerName: 'Monto Cierre',
      field: 'monto_cierre',
      width: 150,
      cellRenderer: (params: any) => (
        <div className='text-right font-semibold text-blue-600'>
          {params.value ? formatCurrency(parseFloat(params.value)) : '-'}
        </div>
      ),
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      cellRenderer: () => (
        <div className='flex justify-center'>
          <Tag color='blue'>CERRADA</Tag>
        </div>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 120,
      cellRenderer: (params: any) => (
        <Tooltip title='Ver Detalles'>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => onVerDetalles(params.data)}
          >
            Ver Detalles
          </Button>
        </Tooltip>
      ),
    },
  ]
}
