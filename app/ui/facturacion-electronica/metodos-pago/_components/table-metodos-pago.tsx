'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App, Space } from 'antd'
import { FaPlus } from 'react-icons/fa'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { despliegueDePagoApi, type DespliegueDePago } from '~/lib/api/despliegue-de-pago'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonBase from '~/components/buttons/button-base'
import TableBase from '~/components/tables/table-base'
import { AgGridReact } from 'ag-grid-react'
import ModalCrearMetodoPago from './modal-crear-metodo-pago'
import ModalEditarMetodoPago from './modal-editar-metodo-pago'
import { apiRequest } from '~/lib/api'
import { useColumnsMetodosPago } from './columns-metodos-pago'

export default function TableMetodosPago() {
  const { message, modal } = App.useApp()
  const [openCrear, setOpenCrear] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<DespliegueDePago | null>(null)
  const gridRef = useRef<AgGridReact<DespliegueDePago>>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
    queryFn: async () => {
      const response = await despliegueDePagoApi.getAll()
      return response.data?.data || []
    },
  })

  const handleEditar = (metodo: DespliegueDePago) => {
    setMetodoSeleccionado(metodo)
    setOpenEditar(true)
  }

  const handleEliminar = (metodo: DespliegueDePago) => {
    modal.confirm({
      title: '¿Eliminar Método de Pago?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>¿Estás seguro de eliminar el método de pago <strong>{metodo.name}</strong>?</p>
          <p className='text-sm text-red-600 mt-2'>
            <strong>Advertencia:</strong> Si este método está siendo usado en ventas o sub-cajas, no se podrá eliminar.
          </p>
        </div>
      ),
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          const response = await apiRequest(`/despliegues-de-pago/${metodo.id}`, {
            method: 'DELETE',
          })

          if (response.error) {
            message.error(response.error.message || 'Error al eliminar el método de pago')
            return
          }

          message.success('Método de pago eliminado exitosamente')
          refetch()
        } catch (error) {
          console.error('Error al eliminar:', error)
          message.error('Error inesperado al eliminar')
        }
      },
    })
  }

  const columns = useColumnsMetodosPago({
    onEditar: handleEditar,
    onEliminar: handleEliminar,
  })

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center mb-4'>
        <div className='text-lg font-semibold text-slate-700'>
          Métodos de Pago Disponibles
        </div>
        <Space>
          <ButtonBase
            color='success'
            onClick={() => setOpenCrear(true)}
            className='flex items-center gap-2'
          >
            <FaPlus />
            Nuevo Método
          </ButtonBase>
        </Space>
      </div>

      <div className='h-[600px] w-full'>
        <TableBase<DespliegueDePago>
          ref={gridRef}
          rowData={data}
          columnDefs={columns}
          loading={isLoading}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>

      <ModalCrearMetodoPago
        open={openCrear}
        setOpen={setOpenCrear}
        onSuccess={refetch}
      />

      {metodoSeleccionado && (
        <ModalEditarMetodoPago
          open={openEditar}
          setOpen={setOpenEditar}
          metodo={metodoSeleccionado}
          onSuccess={() => {
            refetch()
            setMetodoSeleccionado(null)
          }}
        />
      )}
    </div>
  )
}
