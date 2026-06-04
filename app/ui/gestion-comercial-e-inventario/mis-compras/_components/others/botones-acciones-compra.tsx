'use client'

import { message } from 'antd'
import { useState } from 'react'
import { FaEdit, FaEye, FaMoneyBillWave, FaFileInvoiceDollar } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreCompraSeleccionada } from '../../_store/store-compra-seleccionada'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'
import ModalVerDetallesPagos from '../modals/modal-ver-detalles-pagos'
import ModalModificarLotesVencimientos from '../modals/modal-modificar-lotes-vencimientos'
import ModalDocCompra from '../modals/modal-doc-compra'
import ModalAperturarCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-aperturar-caja'
import ModalRegistrarPagoFinanzas from '~/app/ui/gestion-contable-y-financiera/compras-por-pagar/_components/modals/modal-registrar-pago'
import { useCheckAperturaDiaria } from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_hooks/use-check-apertura-diaria'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function BotonesAccionesCompra() {
  const compraSeleccionada = useStoreCompraSeleccionada(state => state.compra)
  const productoSeleccionado = useStoreProductoSeleccionado(state => state.productoSeleccionado)
  const [openModalPago, setOpenModalPago] = useState(false)
  const [openModalDetallesPagos, setOpenModalDetallesPagos] = useState(false)
  const [openModalLotesVencimientos, setOpenModalLotesVencimientos] = useState(false)
  const [openModalDocCompra, setOpenModalDocCompra] = useState(false)
  const [openApertura, setOpenApertura] = useState(false)

  const { hasApertura } = useCheckAperturaDiaria()
  const queryClient = useQueryClient()

  const handleModificarLotes = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    if (!productoSeleccionado) {
      message.warning('Seleccione un producto de la tabla de detalle')
      return
    }
    setOpenModalLotesVencimientos(true)
  }

  const handleVistaPrevia = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    setOpenModalDocCompra(true)
  }

  const handleRegistrarPagos = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    if (!hasApertura) {
      setOpenApertura(true)
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
      <ModalAperturarCaja
        open={openApertura}
        setOpen={setOpenApertura}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })
          setOpenApertura(false)
          setOpenModalPago(true)
        }}
      />

      <ModalRegistrarPagoFinanzas
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

      <ModalDocCompra
        open={openModalDocCompra}
        setOpen={setOpenModalDocCompra}
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
            Registrar Pago de Compra y detalle
          </ButtonBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId='gestion-comercial.mis-compras.boton-ver-detalles-pagos'
          label='Botón Ver Detalles de Pagos'
        >
          <div className='hidden'>
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
          </div>
        </ConfigurableElement>
      </div>
    </>
  )
}
