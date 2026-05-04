'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersComprasPorPagar from './_components/filters/filters-compras-por-pagar'
import TableComprasPorPagar, { useStoreCompraSeleccionada } from './_components/tables/table-compras-por-pagar'
import TableDetalleCompra from './_components/tables/table-detalle-compra'
import CardsInfoComprasPorPagar from './_components/cards/cards-info-compras-por-pagar'
import ModalRegistrarPago from './_components/modals/modal-registrar-pago'
import ModalConsultarPagosCompra from './_components/modals/modal-consultar-pagos-compra'
import { useState } from 'react'
import { App } from 'antd'
import { FaMoneyCheckAlt, FaCalendarCheck, FaUsers } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import ModalPagoMultiple from './_components/modals/modal-pago-multiple'

export default function ComprasPorPagarPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)
  const [openRegistrarPago, setOpenRegistrarPago] = useState(false)
  const [openConsultarPagos, setOpenConsultarPagos] = useState(false)
  const [openPagoMultiple, setOpenPagoMultiple] = useState(false)
  const compraSeleccionada = useStoreCompraSeleccionada(state => state.compra)
  const { message } = App.useApp()

  if (!canAccess) return <NoAutorizado />

  const handleRegistrarPago = () => {
    if (!compraSeleccionada) {
      message.warning('Seleccione una compra primero')
      return
    }
    setOpenRegistrarPago(true)
  }

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4 w-full'>
        <FiltersComprasPorPagar />

        {/* Layout: Cards a la derecha, Tabla a la izquierda */}
        <div className='flex gap-4 w-full'>
          {/* Tabla - Ocupa el espacio principal */}
          <div className='flex-1 min-w-0 flex flex-col gap-4'>
            <div className='h-[calc(50vh-140px)]'>
              <TableComprasPorPagar />
            </div>
            <div className='h-[calc(50vh-140px)]'>
              <TableDetalleCompra />
            </div>
          </div>

          {/* Cards - Columna vertical a la derecha */}
          <div className='w-80 flex-shrink-0 flex flex-col gap-3'>
            <CardsInfoComprasPorPagar />

            {/* Botones de acción */}
            <div className='flex flex-col gap-2 mt-0'>
              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-red-500 !text-red-700 font-semibold hover:bg-red-50'
                onClick={handleRegistrarPago}
              >
                <FaMoneyCheckAlt size={18} />
                Registro y Detalle de Pagos
              </ButtonBase>

              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-rose-500 !text-rose-700 font-semibold hover:bg-rose-50'
                onClick={() => setOpenPagoMultiple(true)}
              >
                <FaUsers size={18} />
                Pago Múltiple por Proveedor
              </ButtonBase>

              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-red-500 !text-red-700 font-semibold hover:bg-red-50'
                onClick={() => setOpenConsultarPagos(true)}
              >
                <FaCalendarCheck size={16} />
                Consultar Pagos por Fecha
              </ButtonBase>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalRegistrarPago
        open={openRegistrarPago}
        setOpen={setOpenRegistrarPago}
        compra={compraSeleccionada}
      />
      <ModalConsultarPagosCompra
        open={openConsultarPagos}
        setOpen={setOpenConsultarPagos}
      />
      <ModalPagoMultiple
        open={openPagoMultiple}
        setOpen={setOpenPagoMultiple}
      />
    </ContenedorGeneral>
  )
}