import { ColDef } from 'ag-grid-community'
import { Tag, Button, Popconfirm, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { formatFechaPeru } from '~/utils/fechas'

export interface DepositoSeguridad {
  id: string
  vendedor: string
  vendedor_id: string
  sub_caja_origen: string
  sub_caja_destino: string
  metodo_origen: string
  banco_origen: string
  metodo_destino: string
  banco_destino: string
  titular?: string
  monto: number
  motivo?: string
  fecha: string
  estado: 'activo' | 'anulado'
}

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return `S/ ${numAmount.toFixed(2)}`
}

export const useColumnsDepositosSeguridad = ({
  onAnular,
}: {
  onAnular: (id: string) => void
}): ColDef<DepositoSeguridad>[] => {
  return [
    {
      colId: 'id',
      headerName: 'ID',
      field: 'id',
      width: 120,
      cellRenderer: (params: any) => (
        <span className='font-mono text-xs text-slate-600'>
          {params.value.substring(0, 8)}...
        </span>
      ),
    },
    {
      colId: 'vendedor',
      headerName: 'Vendedor',
      field: 'vendedor',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <span className='font-medium text-slate-700'>{params.value}</span>
      ),
    },
    {
      colId: 'origen',
      headerName: 'Origen',
      field: 'sub_caja_origen',
      width: 200,
      minWidth: 180,
      cellRenderer: (params: any) => {
        const { sub_caja_origen, metodo_origen, banco_origen } = params.data
        return (
          <div>
            <div className='font-medium text-slate-700'>{sub_caja_origen}</div>
            <div className='text-xs text-slate-500'>
              {metodo_origen} {banco_origen && banco_origen !== '-' ? `- ${banco_origen}` : ''}
            </div>
          </div>
        )
      },
    },
    {
      colId: 'destino',
      headerName: 'Destino',
      field: 'sub_caja_destino',
      width: 280,
      minWidth: 250,
      cellRenderer: (params: any) => {
        const { sub_caja_destino, metodo_destino, banco_destino, titular } = params.data
        return (
          <div>
            <div className='font-medium text-slate-700'>{sub_caja_destino}</div>
            <div className='text-xs text-slate-500'>
              {metodo_destino} - {banco_destino}
            </div>
            {titular && (
              <div className='text-xs text-slate-400'>Titular: {titular}</div>
            )}
          </div>
        )
      },
    },
    {
      colId: 'monto',
      headerName: 'Monto',
      field: 'monto',
      width: 150,
      cellRenderer: (params: any) => (
        <div className='text-right font-bold text-emerald-600'>
          {formatCurrency(params.value)}
        </div>
      ),
    },
    {
      colId: 'motivo',
      headerName: 'Motivo',
      field: 'motivo',
      width: 220,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <span className='text-sm text-slate-600'>{params.value || '-'}</span>
      ),
    },
    {
      colId: 'tipo',
      headerName: 'Tipo',
      width: 180,
      cellRenderer: () => (
        <div className='flex justify-center'>
          <Tag color='blue'>MOVIMIENTO ENTRE CAJAS</Tag>
        </div>
      ),
    },
    {
      colId: 'fecha',
      headerName: 'Fecha',
      field: 'fecha',
      width: 200,
      valueFormatter: (params) => params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
    },
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      cellRenderer: (params: any) => (
        <Tag color={params.value === 'anulado' ? 'red' : 'green'}>
          {params.value === 'anulado' ? 'ANULADO' : 'ACTIVO'}
        </Tag>
      ),
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'id',
      width: 110,
      cellRenderer: (params: any) => {
        if (params.data.estado === 'anulado') return null
        return (
          <Tooltip title='Anular movimiento'>
            <Popconfirm
              title='¿Anular este movimiento?'
              description='El monto se revertirá: volverá a la caja de origen y se descontará del destino.'
              onConfirm={() => onAnular(params.data.id)}
              okText='Sí, anular'
              cancelText='Cancelar'
              okButtonProps={{ danger: true }}
            >
              <Button danger type='text' icon={<DeleteOutlined />} size='small' />
            </Popconfirm>
          </Tooltip>
        )
      },
    },
  ]
}
