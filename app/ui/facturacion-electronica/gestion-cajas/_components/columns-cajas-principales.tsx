import { ColDef } from 'ag-grid-community'
import { CajaPrincipal } from '~/lib/api/caja-principal'
import { Button, Space, Tag, Tooltip } from 'antd'
import { FaEye, FaTrash } from 'react-icons/fa'

export const useColumnsCajasPrincipales = ({
  onVerSubCajas,
  onEliminar,
}: {
  onVerSubCajas: (caja: CajaPrincipal) => void
  onEliminar: (caja: CajaPrincipal) => void
}): ColDef<CajaPrincipal>[] => {
  return [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 120,
      lockPosition: 'left',
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <Tag color='blue' className='font-mono font-bold'>
          {params.value}
        </Tag>
      ),
    },
    {
      headerName: 'Nombre',
      field: 'nombre',
      flex: 1,
      minWidth: 200,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <span className='font-semibold text-slate-700'>{params.value}</span>
      ),
    },
    {
      headerName: 'Responsable',
      field: 'user',
      flex: 1,
      minWidth: 250,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const user = params.value
        return (
          <div>
            <div className='font-medium'>{user?.name}</div>
            <div className='text-xs text-slate-500'>{user?.email}</div>
          </div>
        )
      },
    },
    {
      headerName: 'Sub-Cajas',
      field: 'total_sub_cajas',
      width: 120,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <div className='flex justify-center'>
          <Tag color='cyan' className='font-bold'>
            {params.value}
          </Tag>
        </div>
      ),
    },
    {
      headerName: 'Saldo Total',
      field: 'saldo_total',
      width: 150,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <div className='text-right font-bold text-emerald-600'>
          S/. {parseFloat(params.value).toFixed(2)}
        </div>
      ),
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <div className='flex justify-center'>
          <Tag color={params.value ? 'success' : 'error'}>
            {params.value ? 'Activo' : 'Inactivo'}
          </Tag>
        </div>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 150,
      lockPosition: 'right',
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <Space size='small'>
          <Tooltip title='Ver Sub-Cajas'>
            <Button
              type='primary'
              icon={<FaEye />}
              size='small'
              onClick={() => onVerSubCajas(params.data)}
            />
          </Tooltip>
          <Tooltip title='Eliminar Caja'>
            <Button
              danger
              icon={<FaTrash />}
              size='small'
              onClick={() => onEliminar(params.data)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]
}
