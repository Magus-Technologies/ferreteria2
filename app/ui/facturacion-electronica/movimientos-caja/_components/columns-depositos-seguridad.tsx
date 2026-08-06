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
  // Saldo MOVIBLE (Saldo Cerrado) de cada sub-caja antes/después de este
  // movimiento — null en movimientos creados antes de que este dato se
  // empezara a guardar.
  saldo_origen_anterior?: number | null
  saldo_origen_actual?: number | null
  saldo_destino_anterior?: number | null
  saldo_destino_actual?: number | null
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
      colId: 'sub_caja_origen',
      headerName: 'Sub-Caja Origen',
      field: 'sub_caja_origen',
      width: 160,
      minWidth: 140,
      cellRenderer: (params: any) => (
        <span className='font-medium text-slate-700'>{params.value}</span>
      ),
    },
    {
      colId: 'metodo_origen',
      headerName: 'Método Origen',
      width: 170,
      minWidth: 150,
      cellRenderer: (params: any) => {
        const { metodo_origen, banco_origen } = params.data
        return (
          <div className='text-xs text-slate-600'>
            <div>{metodo_origen}</div>
            {banco_origen && banco_origen !== '-' && (
              <div className='text-slate-400'>{banco_origen}</div>
            )}
          </div>
        )
      },
    },
    {
      colId: 'saldo_origen',
      headerName: 'Saldo Origen (Ant. → Act.)',
      width: 190,
      minWidth: 170,
      cellRenderer: (params: any) => {
        const { saldo_origen_anterior, saldo_origen_actual } = params.data
        if (saldo_origen_anterior == null || saldo_origen_actual == null) {
          return <span className='text-xs text-slate-400'>N/D</span>
        }
        return (
          <div className='text-xs whitespace-nowrap'>
            <span className='text-slate-500'>{formatCurrency(saldo_origen_anterior)}</span>
            <span className='mx-1 text-slate-400'>→</span>
            <span className='font-semibold text-red-600'>{formatCurrency(saldo_origen_actual)}</span>
          </div>
        )
      },
    },
    {
      colId: 'sub_caja_destino',
      headerName: 'Sub-Caja Destino',
      field: 'sub_caja_destino',
      width: 160,
      minWidth: 140,
      cellRenderer: (params: any) => (
        <span className='font-medium text-slate-700'>{params.value}</span>
      ),
    },
    {
      colId: 'metodo_destino',
      headerName: 'Método Destino',
      width: 170,
      minWidth: 150,
      cellRenderer: (params: any) => {
        const { metodo_destino, banco_destino, titular } = params.data
        return (
          <div className='text-xs text-slate-600'>
            <div>{metodo_destino}</div>
            {banco_destino && banco_destino !== '-' && (
              <div className='text-slate-400'>{banco_destino}</div>
            )}
            {titular && <div className='text-slate-400'>Titular: {titular}</div>}
          </div>
        )
      },
    },
    {
      colId: 'saldo_destino',
      headerName: 'Saldo Destino (Ant. → Act.)',
      width: 190,
      minWidth: 170,
      cellRenderer: (params: any) => {
        const { saldo_destino_anterior, saldo_destino_actual } = params.data
        if (saldo_destino_anterior == null || saldo_destino_actual == null) {
          return <span className='text-xs text-slate-400'>N/D</span>
        }
        return (
          <div className='text-xs whitespace-nowrap'>
            <span className='text-slate-500'>{formatCurrency(saldo_destino_anterior)}</span>
            <span className='mx-1 text-slate-400'>→</span>
            <span className='font-semibold text-emerald-600'>{formatCurrency(saldo_destino_actual)}</span>
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
