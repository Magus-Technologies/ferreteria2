'use client'

import { message } from 'antd'
import { useState } from 'react'
import { FaEdit, FaEye, FaMoneyBillWave, FaFileInvoiceDollar } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreCompraSeleccionada } from '../../_store/store-compra-seleccionada'
import ModalRegistrarPagoCompra from '../modals/modal-registrar-pago-compra'
import ModalVerDetallesPagos from '../modals/modal-ver-detalles-pagos'
import ModalModificarLotesVencimientos from '../modals/modal-modificar-lotes-vencimientos'

export default function BotonesAccionesCompra() {
  const compraSeleccionada = useStoreCompraSeleccionada(state => state.compra)
  const [openModalPago, setOpenModalPago] = useState(false)
  const [openModalDetallesPagos, setOpenModalDetallesPagos] = useState(false)
  const [openModalLotesVencimientos, setOpenModalLotesVencimientos] = useState(false)

  const handleModificarLotes = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    setOpenModalLotesVencimientos(true)
  }

  const handleVistaPrevia = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    // Abrir el PDF en una nueva pestaña
    window.open(`/api/pdf/compra/${compraSeleccionada.id}`, '_blank')
  }

  const handleRegistrarPagos = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    setOpenModalPago(true)
  }

  const handleVerDetallesPagos = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    setOpenModalDetallesPagos(true)
  }

  return (
    <>
      <ModalRegistrarPagoCompra
        open={openModalPago}
        setOpen={setOpenModalPago}
        compra={compraSeleccionada}
      />
      
      <ModalVerDetallesPagos
        open={openModalDetallesPagos}
        setOpen={setOpenModalDetallesPagos}
        compra={compraSeleccionada}
      />

      <ModalModificarLotesVencimientos
        open={openModalLotesVencimientos}
        setOpen={setOpenModalLotesVencimientos}
        compra={compraSeleccionada}
      />
      
      <div className='flex flex-wrap items-center gap-2'>
        <ConfigurableElement
          componentId='gestion-comercial.mis-compras.boton-modificar-lotes'
          label='Botón Modificar Lotes y Vencimientos'
        >
          <ButtonBase
            color='warning'
            size='sm'
            type='button'
            onClick={handleModificarLotes}
            className='flex items-center gap-2'
          >
            <FaEdit />
            Modificar Lotes y Vence
          </ButtonBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId='gestion-comercial.mis-compras.boton-vista-previa'
          label='Botón Vista Previa Documento'
        >
          <ButtonBase
            color='info'
            size='sm'
            type='button'
            onClick={handleVistaPrevia}
            className='flex items-center gap-2'
          >
            <FaEye />
            Vista Previa Dcto
          </ButtonBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId='gestion-comercial.mis-compras.boton-registrar-pagos'
          label='Botón Registrar Pagos'
        >
          <ButtonBase
            color='success'
            size='sm'
            type='button'
            onClick={handleRegistrarPagos}
            disabled={!compraSeleccionada}
            className='flex items-center gap-2'
          >
            <FaMoneyBillWave />
            Registrar Pagos
          </ButtonBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId='gestion-comercial.mis-compras.boton-ver-detalles-pagos'
          label='Botón Ver Detalles de Pagos'
        >
          <ButtonBase
            color='default'
            size='sm'
            type='button'
            onClick={handleVerDetallesPagos}
            disabled={!compraSeleccionada}
            className='flex items-center gap-2'
          >
            <FaFileInvoiceDollar />
            Ver Detalles de Pagos
          </ButtonBase>
        </ConfigurableElement>
      </div>
    </>
  )
}
