import { ColDef } from 'ag-grid-community'
import { Tag } from 'antd'

export interface DepositoSeguridad {
  id: string
  vendedor: string
  sub_caja_origen: string
  sub_caja_destino: string
  metodo_destino: string
  banco_destino: string
  titular?: string
  monto: number
  motivo?: string
  fecha: string
}

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return `S/ ${numAmount.toFixed(2)}`
}

export const useColumnsDepositosSeguridad = (): ColDef<DepositoSeguridad>[] => {
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
      cellRenderer: (params: any) => (
        <div>
          <div className='font-medium text-slate-700'>{params.value}</div>
          <div className='text-xs text-slate-500'>Efectivo</div>
        </div>
      ),
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
          <Tag color='blue'>DEPÓSITO SEGURIDAD</Tag>
        </div>
      ),
    },
    {
      colId: 'fecha',
      headerName: 'Fecha',
      field: 'fecha',
      width: 180,
      cellRenderer: (params: any) => (
        <span className='text-sm text-slate-600'>
          {new Date(params.value).toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ]
}
