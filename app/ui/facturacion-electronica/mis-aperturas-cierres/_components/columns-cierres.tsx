import { ColDef } from 'ag-grid-community'
import { AperturaYCierreCaja } from '~/lib/api/caja'
import { Button, Tag, Tooltip } from 'antd'
import { FaFilePdf, FaCheckCircle, FaRedo, FaMoneyBillWave } from 'react-icons/fa'
import dayjs from 'dayjs'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

const getEstadoCierreConfig = (estadoCierre: string | null | undefined) => {
  switch (estadoCierre) {
    case 'aprobado':
      return { color: 'green', label: 'APROBADO' }
    case 'en_proceso':
      return { color: 'blue', label: 'EN PROCESO' }
    case 'pendiente':
      return { color: 'orange', label: 'PENDIENTE' }
    case 'no_realizado':
      return { color: 'red', label: 'NO REALIZADO' }
    default:
      return { color: 'default', label: 'SIN CIERRE' }
  }
}

export const useColumnsCierres = ({
  onVerTicket,
  onAprobarCierre,
  onReCerrarCaja,
  onPagarDeuda,
}: {
  onVerTicket: (cierre: AperturaYCierreCaja) => void
  onAprobarCierre?: (cierre: AperturaYCierreCaja) => void
  onReCerrarCaja?: (cierre: AperturaYCierreCaja) => void
  onPagarDeuda?: (cierre: AperturaYCierreCaja) => void
}): ColDef<AperturaYCierreCaja>[] => {
  return [
    {
      headerName: 'Fecha Cierre',
      field: 'fecha_cierre',
      width: 170,
      cellRenderer: (params: any) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      headerName: 'Vendedor',
      field: 'vendedor' as any,
      flex: 1,
      minWidth: 180,
      cellRenderer: (params: any) => {
        const vendedor = params.value
        return (
          <div>
            <div className='font-medium text-slate-700'>{vendedor?.name || '-'}</div>
            <div className='text-xs text-slate-500'>{vendedor?.email || ''}</div>
          </div>
        )
      },
    },
    {
      headerName: 'Caja',
      field: 'caja_principal',
      width: 150,
      cellRenderer: (params: any) => {
        const caja = params.value
        return (
          <div className='font-medium'>{caja?.nombre || '-'}</div>
        )
      },
    },
    {
      headerName: 'Monto Apertura',
      field: 'monto_apertura',
      width: 140,
      cellRenderer: (params: any) => (
        <div className='text-right'>
          {formatCurrency(parseFloat(params.value || 0))}
        </div>
      ),
    },
    {
      headerName: 'Monto Cierre',
      field: 'monto_cierre',
      width: 140,
      cellRenderer: (params: any) => (
        <div className='text-right font-semibold text-blue-600'>
          {params.value ? formatCurrency(parseFloat(params.value)) : '-'}
        </div>
      ),
    },
    {
      headerName: 'Diferencia',
      field: 'diferencia_efectivo' as any,
      width: 130,
      cellRenderer: (params: any) => {
        const diferencia = parseFloat(params.value || 0)
        const deuda = params.data.deuda
        return (
          <div className='flex flex-col items-end pb-1'>
            <span className={`text-right font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
            </span>
            {deuda && (
              <Tag color={deuda.estado === 'pendiente' ? 'red' : 'green'} className='mt-0.5 mr-0 text-[10px] leading-tight'>
                {deuda.estado === 'pendiente' ? 'DEUDA PEND.' : 'DEUDA PAG.'}
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Estado Cierre',
      field: 'estado_cierre',
      width: 140,
      cellRenderer: (params: any) => {
        const config = getEstadoCierreConfig(params.value)
        return (
          <div className='flex justify-center'>
            <Tag color={config.color}>
              {config.label}
            </Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 130,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const estadoCierre = params.data.estado_cierre
        return (
          <div className='flex gap-1 items-center justify-center'>
            <Tooltip title='Ver Ticket de Cierre'>
              <Button
                type='link'
                size='small'
                className='flex items-center gap-1'
                onClick={() => onVerTicket(params.data)}
              >
                <FaFilePdf className='text-red-600 text-lg' />
              </Button>
            </Tooltip>
            {estadoCierre === 'pendiente' && onAprobarCierre && (
              <Tooltip title='Aprobar Cierre'>
                <Button
                  type='link'
                  size='small'
                  className='flex items-center gap-1'
                  onClick={() => onAprobarCierre(params.data)}
                >
                  <FaCheckCircle className='text-green-600 text-lg' />
                </Button>
              </Tooltip>
            )}
            {onReCerrarCaja && (
              <Tooltip title='Volver a Cerrar'>
                <Button
                  type='link'
                  size='small'
                  className='flex items-center gap-1'
                  onClick={() => onReCerrarCaja(params.data)}
                >
                  <FaRedo className='text-blue-600 text-lg' />
                </Button>
              </Tooltip>
            )}
            {params.data.deuda?.estado === 'pendiente' && onPagarDeuda && (
              <Tooltip title='Pagar Deuda Faltante'>
                <Button
                  type='link'
                  size='small'
                  className='flex items-center gap-1'
                  onClick={() => onPagarDeuda(params.data)}
                >
                  <FaMoneyBillWave className='text-amber-600 text-lg' />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ]
}
