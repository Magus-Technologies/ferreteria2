import { Modal, message } from 'antd'
import { Prisma } from '@prisma/client'
import { type FormInstance } from 'antd'
import FiltersRecuperarOrdenCompra from '../others/filters-recuperar-orden-compra'
import TableOrdenesCompra from '../tables/table-ordenes-compra'
import TableDetalleOrdenCompra from '../tables/table-detalle-orden-compra'
import { useStoreOrdenCompraSeleccionada } from '../../_store/store-orden-compra-seleccionada'
import { loadCompraIntoForm } from '../../_utils/load-compra-into-form'
import { useState } from 'react'

type ModalRecuperarOrdenCompraProps = {
  open: boolean
  setOpen: (open: boolean) => void
  setFiltros: (data: Prisma.CompraWhereInput) => void
  form: FormInstance
}

export default function ModalRecuperarOrdenCompra({
  open,
  setOpen,
  setFiltros,
  form,
}: ModalRecuperarOrdenCompraProps) {
  const compraSeleccionada = useStoreOrdenCompraSeleccionada(
    state => state.compra
  )
  const setCompraSeleccionada = useStoreOrdenCompraSeleccionada(
    state => state.setCompra
  )
  const [loading, setLoading] = useState(false)

  const handleSeleccionar = () => {
    if (!compraSeleccionada) {
      message.error('Debe seleccionar una orden de compra')
      return
    }

    setLoading(true)

    try {
      const result = loadCompraIntoForm(compraSeleccionada, form)

      if (result.success) {
        message.success('Orden de compra cargada correctamente')
        setTimeout(() => {
          setOpen(false)
          setCompraSeleccionada(undefined)
        }, 500)
      } else {
        message.error(result.message || 'Error al cargar la orden de compra')
      }
    } catch (error) {
      console.error('Error al cargar orden de compra:', error)
      message.error('Error al cargar datos en el formulario')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setCompraSeleccionada(undefined)
  }

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title='Recuperar Orden de Compra'
      okText='Seleccionar'
      cancelText='Cerrar'
      onOk={handleSeleccionar}
      onCancel={handleClose}
      confirmLoading={loading}
      maskClosable={false}
      keyboard={false}
      destroyOnClose
    >
      <div className='flex items-center gap-2 mb-4'>
        <FiltersRecuperarOrdenCompra setFiltros={setFiltros} />
      </div>
      <div className='flex flex-col gap-4' style={{ height: '600px' }}>
        <div style={{ height: '300px' }}>
          <TableOrdenesCompra />
        </div>
        <div style={{ height: '300px' }}>
          <TableDetalleOrdenCompra
            compraSeleccionada={compraSeleccionada}
            setCompraSeleccionada={setCompraSeleccionada}
          />
        </div>
      </div>
    </Modal>
  )
}
