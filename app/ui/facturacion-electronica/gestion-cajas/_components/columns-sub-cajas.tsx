import { ColDef } from 'ag-grid-community'
import { SubCaja } from '~/lib/api/caja-principal'
import { Button, Space, Tag, Tooltip } from 'antd'
import { FaEdit, FaTrash } from 'react-icons/fa'

export const useColumnsSubCajas = ({
  onEditar,
  onEliminar,
}: {
  onEditar: (subCaja: SubCaja) => void
  onEliminar: (subCaja: SubCaja) => void
}): ColDef<SubCaja>[] => {
  return [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 130,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => (
        <Tag color='purple' className='font-mono font-bold'>
          {params.value}
        </Tag>
      ),
    },
    {
      headerName: 'Nombre',
      field: 'nombre',
      flex: 1,
      minWidth: 180,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const record = params.data
        return (
          <div>
            <div className='font-semibold'>{params.value}</div>
            {record.es_caja_chica && (
              <Tag color='gold' className='mt-1'>
                Caja Chica
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Métodos de Pago',
      field: 'despliegues_pago',
      flex: 1,
      minWidth: 200,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const record = params.data
        if (record.acepta_todos_metodos) {
          return (
            <Tag color='purple' className='font-semibold'>
              TODOS LOS MÉTODOS
            </Tag>
          )
        }
        
        if (!record.despliegues_pago || record.despliegues_pago.length === 0) {
          return <span className='text-slate-400'>-</span>
        }
        
        return (
          <Space size={[0, 4]} wrap>
            {record.despliegues_pago.map((despliegue: any) => (
              <Tag key={despliegue.id} color='geekblue'>
                {despliegue.name}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      headerName: 'Comprobantes',
      field: 'tipos_comprobante_labels',
      flex: 1,
      minWidth: 180,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const labels = params.value
        if (!labels || labels.length === 0) {
          return <span className='text-slate-400'>-</span>
        }
        return (
          <Space size={[0, 4]} wrap>
            {labels.map((label: string, index: number) => (
              <Tag key={index} color='blue'>
                {label}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      headerName: 'Saldo',
      field: 'saldo_actual',
      width: 130,
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
      width: 100,
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
      width: 120,
      lockPosition: true,
      suppressMovable: true,
      cellRenderer: (params: any) => {
        const record = params.data
        return (
          <Space size='small'>
            {record.puede_modificar && (
              <Tooltip title='Editar'>
                <Button
                  type='default'
                  icon={<FaEdit />}
                  size='small'
                  onClick={() => onEditar(record)}
                />
              </Tooltip>
            )}
            {record.puede_eliminar && (
              <Tooltip title='Eliminar'>
                <Button
                  type='default'
                  danger
                  icon={<FaTrash />}
                  size='small'
                  onClick={() => onEliminar(record)}
                />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]
}
