import { ColDef } from 'ag-grid-community'
import { AperturaYCierreCaja } from '~/lib/api/caja'
import { Button, Tag, Tooltip } from 'antd'
import { EyeOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

export const useColumnsCierres = ({
  onVerDetalles,
  isAdmin = false,
}: {
  onVerDetalles: (cierre: AperturaYCierreCaja) => void
  isAdmin?: boolean
}): ColDef<AperturaYCierreCaja>[] => {
  
  console.log('🔐 useColumnsCierres - isAdmin:', isAdmin);
  
  const handleActualizar = (cierre: AperturaYCierreCaja) => {
    // Redirigir a la vista de cierre de caja con el ID del cierre
    window.location.href = `/ui/facturacion-electronica/cierre-caja?cierre_id=${cierre.id}`;
  }

  const baseColumns: ColDef<AperturaYCierreCaja>[] = [
    {
      headerName: 'Fecha Cierre',
      field: 'fecha_cierre',
      width: 180,
      cellRenderer: (params: any) => 
        params.value ? dayjs(params.value).format('DD/MM/YYYY HH:mm') : '-',
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
      headerName: 'Diferencia',
      field: 'monto_cierre',
      width: 120,
      cellRenderer: (params: any) => {
        const montoApertura = parseFloat(params.data.monto_apertura || 0)
        const montoCierre = parseFloat(params.value || 0)
        const diferencia = montoCierre - montoApertura
        
        return (
          <div className={`text-right font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
          </div>
        )
      },
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
      width: isAdmin ? 260 : 130,
      pinned: 'right',
      cellRenderer: (params: any) => {
        console.log('🎯 Renderizando acciones - isAdmin:', isAdmin);
        return (
          <div className='flex gap-1 items-center justify-start'>
            <Tooltip title='Ver Detalles'>
              <Button
                type='link'
                size='small'
                icon={<EyeOutlined />}
                onClick={() => onVerDetalles(params.data)}
              >
                Detalles
              </Button>
            </Tooltip>
            {isAdmin && (
              <Tooltip title='Editar/Actualizar Cierre (Solo Admin)'>
                <Button
                  type='link'
                  size='small'
                  icon={<SyncOutlined />}
                  style={{ color: '#ea580c' }}
                  onClick={() => handleActualizar(params.data)}
                >
                  Actualizar
                </Button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ]
  
  return baseColumns
}
