'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App, Space, Tag, Button, Tooltip } from 'antd'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { Eye } from 'lucide-react'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import { metodoDePagoApi, type MetodoDePago } from '~/lib/api/metodo-de-pago'
import { despliegueDePagoApi, type DespliegueDePago } from '~/lib/api/despliegue-de-pago'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonBase from '~/components/buttons/button-base'
import TableBase from '~/components/tables/table-base'
import ModalRegistroCompleto from './modal-registro-completo'

interface BancoConMetodos extends MetodoDePago {
  metodos?: DespliegueDePago[]
}

interface Props {
  onBancoDoubleClick?: (banco: MetodoDePago) => void
}

export default function TableMetodosPagoUnificado({ onBancoDoubleClick }: Props) {
  const { message, modal } = App.useApp()
  const [openRegistro, setOpenRegistro] = useState(false)
  const [bancoParaEditar, setBancoParaEditar] = useState<MetodoDePago | null>(null)
  const gridRef = useRef<AgGridReact<BancoConMetodos>>(null)

  const { data: bancos, isLoading: loadingBancos, refetch: refetchBancos } = useQuery({
    queryKey: [QueryKeys.METODO_DE_PAGO],
    queryFn: async () => {
      const response = await metodoDePagoApi.getAll()
      return response.data?.data || []
    },
  })

  const { data: metodos, isLoading: loadingMetodos, refetch: refetchMetodos } = useQuery({
    queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
    queryFn: async () => {
      const response = await despliegueDePagoApi.getAll()
      return response.data?.data || []
    },
  })

  const bancosConMetodos: BancoConMetodos[] = bancos?.map(banco => ({
    ...banco,
    metodos: metodos?.filter(m => m.metodo_de_pago_id === banco.id) || []
  })) || []

  const handleEditarBanco = (banco: MetodoDePago) => {
    setBancoParaEditar(banco)
    setOpenRegistro(true)
  }

  const handleEliminarBanco = (banco: MetodoDePago) => {
    const metodosDelBanco = metodos?.filter(m => m.metodo_de_pago_id === banco.id) || []

    modal.confirm({
      title: '¿Eliminar Banco?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>¿Estás seguro de eliminar el banco <strong>{banco.name}</strong>?</p>
          {metodosDelBanco.length > 0 && (
            <p className='text-sm text-red-600 mt-2'>
              <strong>Advertencia:</strong> Este banco tiene {metodosDelBanco.length} método(s) asociado(s).
            </p>
          )}
        </div>
      ),
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          const response = await metodoDePagoApi.delete(banco.id)
          if (response.error) {
            message.error(response.error.message || 'Error al eliminar')
            return
          }
          message.success('Banco eliminado/desactivado exitosamente')
          refetchBancos()
        } catch (error) {
          message.error('Error inesperado')
        }
      },
    })
  }

  const columns: ColDef<BancoConMetodos>[] = [
    {
      headerName: 'Banco/Entidad',
      field: 'name',
      width: 180,
      cellRenderer: (params: any) => (
        <span className='font-semibold text-slate-700'>{params.value}</span>
      ),
      onCellDoubleClicked: (params) => {
        // Solo permitir doble clic en bancos digitales (no efectivo)
        // Filtrar bancos que son de efectivo (Caja Chica, Efectivo, etc.)
        const bancosEfectivo = ['efectivo', 'caja chica', 'caja', 'cash']
        const esEfectivo = bancosEfectivo.some(term => 
          params.data?.name?.toLowerCase().includes(term)
        )
        
        if (params.data && onBancoDoubleClick && !esEfectivo) {
          onBancoDoubleClick(params.data)
        } else if (esEfectivo) {
          message.info('Los métodos de pago en efectivo no tienen resumen detallado')
        }
      },
    },
    {
      headerName: 'Titular',
      field: 'nombre_titular',
      width: 180,
      cellRenderer: (params: any) => (
        <span className='text-slate-600'>{params.value || '-'}</span>
      ),
    },
    {
      headerName: 'Cuenta Bancaria',
      field: 'cuenta_bancaria',
      width: 180,
      cellRenderer: (params: any) => (
        <span className='text-slate-600'>{params.value || '-'}</span>
      ),
    },
    {
      headerName: 'Métodos de Pago',
      field: 'metodos',
      flex: 1,
      minWidth: 300,
      autoHeight: true,
      cellRenderer: (params: any) => {
        const metodos: DespliegueDePago[] = params.value || []
        if (metodos.length === 0) {
          return <span className='text-slate-400 text-sm'>Sin métodos</span>
        }
        return (
          <div className='flex flex-wrap gap-2 py-2'>
            {metodos.map((metodo) => (
              <div key={metodo.id} className='flex items-center gap-1 bg-amber-50 border border-amber-200 rounded px-2 py-1'>
                <span className='text-xs font-medium text-slate-700'>{metodo.name}</span>
                {metodo.tipo_sobrecargo === 'porcentaje' && (
                  <span className='text-xs text-orange-600 font-semibold'>+{metodo.sobrecargo_porcentaje}%</span>
                )}
                {metodo.tipo_sobrecargo === 'monto_fijo' && (
                  <span className='text-xs text-purple-600 font-semibold'>+S/.{metodo.adicional}</span>
                )}
              </div>
            ))}
          </div>
        )
      },
    },
    {
      headerName: 'Números de Celular',
      field: 'metodos',
      width: 180,
      autoHeight: true,
      cellRenderer: (params: any) => {
        const metodos: DespliegueDePago[] = params.value || []
        const metodosConCelular = metodos.filter(m => m.numero_celular)
        
        if (metodosConCelular.length === 0) {
          return <span className='text-slate-400 text-xs'>-</span>
        }
        
        return (
          <div className='flex flex-col gap-1 py-2'>
            {metodosConCelular.map((metodo) => (
              <div key={metodo.id} className='text-xs'>
                <span className='text-slate-600 font-medium'>{metodo.name}:</span>{' '}
                <span className='text-blue-600'>{metodo.numero_celular}</span>
              </div>
            ))}
          </div>
        )
      },
    },
    {
      headerName: 'Total',
      field: 'metodos',
      width: 80,
      cellRenderer: (params: any) => {
        const count = params.value?.length || 0
        return (
          <div className='flex justify-center'>
            <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 160,
      cellRenderer: (params: any) => {
        // Verificar si es un banco digital (no efectivo)
        const bancosEfectivo = ['efectivo', 'caja chica', 'caja', 'cash']
        const esEfectivo = bancosEfectivo.some(term => 
          params.data?.name?.toLowerCase().includes(term)
        )
        
        return (
          <Space size='small'>
            {!esEfectivo && (
              <Tooltip title='Ver resumen detallado'>
                <Button
                  type='default'
                  size='small'
                  icon={<Eye className="h-4 w-4" />}
                  onClick={() => onBancoDoubleClick?.(params.data)}
                />
              </Tooltip>
            )}
            <Tooltip title='Editar banco'>
              <Button
                type='primary'
                size='small'
                icon={<FaEdit />}
                onClick={() => handleEditarBanco(params.data)}
              />
            </Tooltip>
            <Tooltip title='Eliminar banco'>
              <Button
                danger
                size='small'
                icon={<FaTrash />}
                onClick={() => handleEliminarBanco(params.data)}
              />
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <div className='text-lg font-semibold text-slate-700'>
            Gestión de Métodos de Pago
          </div>
          <p className='text-sm text-slate-500'>
            Registra bancos y sus métodos de pago
          </p>
        </div>
        <ButtonBase
          color='success'
          onClick={() => setOpenRegistro(true)}
          className='flex items-center gap-2'
        >
          <FaPlus />
          Registrar Banco y Métodos
        </ButtonBase>
      </div>

      <div className='h-[600px] w-full'>
        <TableBase<BancoConMetodos>
          ref={gridRef}
          rowData={bancosConMetodos}
          columnDefs={columns}
          loading={loadingBancos || loadingMetodos}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>

      <ModalRegistroCompleto
        open={openRegistro}
        setOpen={(open) => {
          setOpenRegistro(open)
          if (!open) setBancoParaEditar(null)
        }}
        bancoInicial={bancoParaEditar}
        onSuccess={() => {
          refetchBancos()
          refetchMetodos()
          setBancoParaEditar(null)
        }}
      />
    </div>
  )
}
