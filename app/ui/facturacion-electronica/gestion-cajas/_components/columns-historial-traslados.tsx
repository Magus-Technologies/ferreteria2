import { ColDef } from 'ag-grid-community'
import { Button, Tag, Tooltip } from 'antd'
import { FaTrash } from 'react-icons/fa'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TrasladoBoveda } from '~/lib/api/traslado-boveda'

export const useColumnsHistorialTraslados = ({
  onAnular,
}: {
  onAnular: (traslado: TrasladoBoveda) => void
}): ColDef<TrasladoBoveda>[] => {
  return [
    {
      headerName: 'Fecha',
      field: 'fecha_traslado',
      width: 180,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return '-'
        return format(new Date(params.value), 'dd/MM/yyyy HH:mm', { locale: es })
      },
    },
    {
      headerName: 'Caja',
      field: 'sub_caja',
      flex: 1,
      minWidth: 150,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const subCaja = params.value
        if (!subCaja) return '-'
        return (
          <div>
            <div className='font-semibold'>{subCaja.nombre}</div>
            <div className='text-xs text-slate-500'>{subCaja.codigo}</div>
          </div>
        )
      },
    },
    {
      headerName: 'Vendedor',
      field: 'vendedor',
      flex: 1,
      minWidth: 150,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const vendedor = params.value
        if (!vendedor) return '-'
        return <span className='font-medium'>{vendedor.name}</span>
      },
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 130,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <div className='text-right font-bold text-amber-600'>
          S/ {parseFloat(params.value).toFixed(2)}
        </div>
      ),
    },
    {
      headerName: 'Supervisor',
      field: 'supervisor',
      flex: 1,
      minWidth: 150,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const supervisor = params.value
        if (!supervisor) return '-'
        return (
          <div className='flex items-center gap-2'>
            <Tag color='purple' className='font-medium'>
              {supervisor.name}
            </Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Justificación',
      field: 'justificacion',
      flex: 2,
      minWidth: 200,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return <span className='text-slate-400'>-</span>
        return (
          <Tooltip title={params.value}>
            <span className='text-sm'>{params.value}</span>
          </Tooltip>
        )
      },
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 100,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const record = params.data
        return (
          <div className='flex justify-center'>
            <Tooltip title='Anular traslado'>
              <Button
                type='default'
                danger
                icon={<FaTrash />}
                size='small'
                onClick={() => onAnular(record)}
              />
            </Tooltip>
          </div>
        )
      },
    },
  ]
}
