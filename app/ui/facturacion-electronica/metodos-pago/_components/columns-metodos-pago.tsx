import { ColDef } from 'ag-grid-community'
import { DespliegueDePago } from '~/lib/api/despliegue-de-pago'
import { Button, Space, Tag, Tooltip } from 'antd'
import { FaEdit, FaTrash } from 'react-icons/fa'

export const useColumnsMetodosPago = ({
  onEditar,
  onEliminar,
}: {
  onEditar: (metodo: DespliegueDePago) => void
  onEliminar: (metodo: DespliegueDePago) => void
}): ColDef<DespliegueDePago>[] => {
  return [
    {
      headerName: 'Nombre',
      field: 'name',
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <span className='font-semibold text-slate-700'>{params.value}</span>
      ),
    },
    {
      headerName: 'Requiere N° Operación',
      field: 'requiere_numero_serie',
      width: 180,
      cellRenderer: (params: any) => (
        <div className='flex justify-center'>
          {params.value ? (
            <Tag color='blue'>Sí requiere</Tag>
          ) : (
            <Tag color='default'>No requiere</Tag>
          )}
        </div>
      ),
    },
    {
      headerName: 'Tipo Sobrecargo',
      field: 'tipo_sobrecargo',
      width: 150,
      cellRenderer: (params: any) => {
        const tipo = params.value
        if (tipo === 'porcentaje') return <Tag color='orange'>Porcentaje</Tag>
        if (tipo === 'monto_fijo') return <Tag color='purple'>Monto Fijo</Tag>
        return <Tag color='default'>Ninguno</Tag>
      },
    },
    {
      headerName: 'Sobrecargo',
      field: 'sobrecargo_porcentaje',
      width: 120,
      cellRenderer: (params: any) => {
        const tipo = params.data.tipo_sobrecargo
        const valor = params.value
        
        if (tipo === 'porcentaje' && valor > 0) {
          return <span className='font-semibold text-orange-600'>{valor}%</span>
        }
        if (tipo === 'monto_fijo') {
          return <span className='font-semibold text-purple-600'>S/. {params.data.adicional}</span>
        }
        return <span className='text-slate-400'>-</span>
      },
    },
    {
      headerName: 'Visible',
      field: 'mostrar',
      width: 100,
      cellRenderer: (params: any) => (
        <div className='flex justify-center'>
          {params.value ? (
            <Tag color='success'>Sí</Tag>
          ) : (
            <Tag color='error'>No</Tag>
          )}
        </div>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 150,
      cellRenderer: (params: any) => (
        <Space size='small'>
          <Tooltip title='Editar'>
            <Button
              type='primary'
              icon={<FaEdit />}
              size='small'
              onClick={() => onEditar(params.data)}
            />
          </Tooltip>
          <Tooltip title='Eliminar'>
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
