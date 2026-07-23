import { ColDef } from 'ag-grid-community'
import { SubCaja } from '~/lib/api/caja-principal'
import { Button, Space, Tag, Tooltip } from 'antd'
import { FaEdit, FaTrash, FaWarehouse } from 'react-icons/fa'

export const useColumnsSubCajas = ({
  onEditar,
  onEliminar,
  onVerHistorialTraslados,
  saldosNoCerrados,
}: {
  onEditar: (subCaja: SubCaja) => void
  onEliminar: (subCaja: SubCaja) => void
  onVerHistorialTraslados?: (subCaja: SubCaja) => void
  /** Dinero de la sesión ABIERTA por sub-caja (sub_caja_id → monto sin cerrar) */
  saldosNoCerrados?: Record<number, number>
}): ColDef<SubCaja>[] => {
  return [
    {
      colId: 'codigo',
      headerName: 'Código',
      field: 'codigo',
      width: 130,
      cellRenderer: (params: any) => (
        <Tag color='purple' className='font-mono font-bold'>
          {params.value}
        </Tag>
      ),
    },
    {
      colId: 'nombre',
      headerName: 'Nombre',
      field: 'nombre',
      flex: 1,
      minWidth: 180,
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
      colId: 'metodos_pago',
      headerName: 'Métodos de Pago',
      field: 'despliegues_pago',
      width: 250,
      minWidth: 200,
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
      colId: 'comprobantes',
      headerName: 'Comprobantes',
      field: 'tipos_comprobante_labels',
      width: 220,
      minWidth: 180,
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
      colId: 'saldo',
      headerName: 'Saldo',
      field: 'saldo_actual',
      width: 130,
      cellRenderer: (params: any) => (
        <div className='text-right font-bold text-emerald-600'>
          S/. {parseFloat(params.value).toFixed(2)}
        </div>
      ),
    },
    {
      colId: 'saldo_no_cerrado',
      headerName: 'Saldo No Cerrado',
      headerTooltip: 'Dinero de la sesión abierta (aún sin cerrar caja); no se puede trasladar hasta cerrar',
      width: 150,
      cellRenderer: (params: any) => {
        const noCerrado = saldosNoCerrados?.[params.data?.id] ?? 0
        if (noCerrado <= 0) {
          return <div className='text-right text-slate-400'>S/. 0.00</div>
        }
        return (
          <div className='text-right font-bold text-blue-600'>
            S/. {noCerrado.toFixed(2)}
          </div>
        )
      },
    },
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      width: 100,
      cellRenderer: (params: any) => (
        <div className='flex justify-center'>
          <Tag color={params.value ? 'success' : 'error'}>
            {params.value ? 'Activo' : 'Inactivo'}
          </Tag>
        </div>
      ),
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'id',
      width: 160,
      cellRenderer: (params: any) => {
        const record = params.data
        return (
          <Space size='small'>
            {record.es_caja_chica && onVerHistorialTraslados && (
              <Tooltip title='Historial de Traslados a Bóveda'>
                <Button
                  type='default'
                  icon={<FaWarehouse />}
                  size='small'
                  className='text-amber-600 hover:text-amber-700 border-amber-300 hover:border-amber-400'
                  onClick={() => onVerHistorialTraslados(record)}
                />
              </Tooltip>
            )}
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
