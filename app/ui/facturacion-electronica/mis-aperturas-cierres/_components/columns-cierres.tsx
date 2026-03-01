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

// Estilo reutilizable para centrar el contenido de la celda
const centerCell = { display: 'flex', alignItems: 'center', justifyContent: 'center' }

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
      flex: 1,
      minWidth: 130,
      cellStyle: centerCell,
      cellRenderer: (params: any) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      // Sin centrado — texto izquierda por defecto
      headerName: 'Vendedor',
      field: 'vendedor' as any,
      flex: 1,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const vendedor = params.value
        return (
          <div className='truncate'>
            <div className='font-medium text-slate-700 truncate'>{vendedor?.name || '-'}</div>
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
      cellRenderer: (params: any) => {
        const caja = params.value
        return (
          <div className='font-medium truncate'>{caja?.nombre || '-'}</div>
        )
      },
    },
    {
      headerName: 'M. Apertura',
      field: 'monto_apertura',
      flex: 1,
      minWidth: 100,
      cellStyle: centerCell,
      cellRenderer: (params: any) => (
        <span>{formatCurrency(parseFloat(params.value || 0))}</span>
      ),
    },
    {
      headerName: 'M. Cierre',
      field: 'monto_cierre',
      flex: 1,
      minWidth: 100,
      cellStyle: centerCell,
      cellRenderer: (params: any) => (
        <span className='font-semibold text-blue-600'>
          {params.value ? formatCurrency(parseFloat(params.value)) : '-'}
        </span>
      ),
    },
    {
      headerName: 'Diferencia',
      field: 'diferencia_efectivo' as any,
      flex: 1,
      minWidth: 100,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      cellRenderer: (params: any) => {
        const diferencia = parseFloat(params.value || 0)
        const deuda = params.data.deuda
        return (
          <div className='flex flex-col items-center'>
            <span className={`font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
            </span>
            {deuda && (
              <Tag
                color={
                  deuda.estado === 'pendiente' ? 'red' :
                  deuda.estado === 'parcialmente_pagada' ? 'orange' :
                  'green'
                }
                className='mt-0.5 mr-0 text-[10px] leading-tight'
              >
                {deuda.estado === 'pendiente' ? 'DEUDA PEND.' :
                 deuda.estado === 'parcialmente_pagada' ? 'DEUDA PARC.' :
                 'DEUDA PAG.'}
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Estado',
      field: 'estado_cierre',
      flex: 1,
      minWidth: 100,
      cellStyle: centerCell,
      cellRenderer: (params: any) => {
        const config = getEstadoCierreConfig(params.value)
        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 120,
      pinned: 'right',
      cellStyle: centerCell,
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
            {(params.data.deuda?.estado === 'pendiente' || params.data.deuda?.estado === 'parcialmente_pagada') && onPagarDeuda && (
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
            {params.data.deuda?.estado === 'pagada' && onPagarDeuda && (
              <Tooltip title='Ver Historial de Abonos'>
                <Button
                  type='link'
                  size='small'
                  className='flex items-center gap-1'
                  onClick={() => onPagarDeuda(params.data)}
                >
                  <FaMoneyBillWave className='text-green-600 text-lg' />
                </Button>
              </Tooltip>
            )}
          </div>
        )
      },
    },
  ]
}