'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersVentasPorCobrar from './_components/filters/filters-ventas-por-cobrar'
import TableVentasPorCobrar, { useStoreVentaSeleccionada } from './_components/tables/table-ventas-por-cobrar'
import TableDetalleVenta from './_components/tables/table-detalle-venta'
import CardsInfoVentasPorCobrar from './_components/cards/cards-info-ventas-por-cobrar'
import ModalRegistrarCobro from './_components/modals/modal-registrar-cobro'
import ModalConsultarPagos from './_components/modals/modal-consultar-pagos'
import { useState } from 'react'
import { App } from 'antd'
import { FaMoneyCheckAlt, FaListAlt, FaCalendarCheck, FaUsers, FaPrint } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import ModalCobroMultiple from './_components/modals/modal-cobro-multiple'
import ModalImprimirTicketsMasivos from './_components/modals/modal-imprimir-tickets-masivos'

export default function VentasPorCobrarPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)
  const [openRegistrarCobro, setOpenRegistrarCobro] = useState(false)
  const [openConsultarPagos, setOpenConsultarPagos] = useState(false)
  const [openCobroMultiple, setOpenCobroMultiple] = useState(false)
  const [openImprimirMasivo, setOpenImprimirMasivo] = useState(false)
  const ventaSeleccionada = useStoreVentaSeleccionada(state => state.venta)
  const { message } = App.useApp()

  if (!canAccess) return <NoAutorizado />

  const handleRegistrarCobro = () => {
    if (!ventaSeleccionada) {
      message.warning('Seleccione una venta primero')
      return
    }
    setOpenRegistrarCobro(true)
  }

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4 w-full'>
        <FiltersVentasPorCobrar />

        {/* Layout: Cards a la derecha, Tabla a la izquierda */}
        <div className='flex gap-4 w-full'>
          {/* Tabla - Ocupa el espacio principal */}
          <div className='flex-1 min-w-0 flex flex-col gap-4'>
            <div className='h-[calc(50vh-140px)]'>
              <TableVentasPorCobrar />
            </div>
            <div className='h-[calc(50vh-140px)]'>
              <TableDetalleVenta />
            </div>
          </div>

          {/* Cards - Columna vertical a la derecha */}
          <div className='w-80 flex-shrink-0 flex flex-col gap-3'>
            <CardsInfoVentasPorCobrar />

            {/* Botones de acción */}
            <div className='flex flex-col gap-2 mt-2'>
              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-green-500 !text-green-700 font-semibold hover:bg-green-50'
                onClick={handleRegistrarCobro}
              >
                <FaMoneyCheckAlt size={18} />
                Registrar Cobros
              </ButtonBase>

              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-blue-500 !text-blue-700 font-semibold hover:bg-blue-50'
                onClick={() => {
                  if (!ventaSeleccionada) {
                    message.warning('Seleccione una venta primero')
                    return
                  }
                  setOpenRegistrarCobro(true)
                }}
              >
                <FaListAlt size={16} />
                Ver Detalle de Pagos
              </ButtonBase>

              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-emerald-500 !text-emerald-700 font-semibold hover:bg-emerald-50'
                onClick={() => setOpenCobroMultiple(true)}
              >
                <FaUsers size={18} />
                Cobro Múltiple por Cliente
              </ButtonBase>

              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-rose-500 !text-rose-700 font-semibold hover:bg-rose-50'
                onClick={() => setOpenImprimirMasivo(true)}
              >
                <FaPrint size={18} />
                Imprimir Tickets Masivos
              </ButtonBase>

              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-orange-500 !text-orange-700 font-semibold hover:bg-orange-50'
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
      <ModalRegistrarCobro
        open={openRegistrarCobro}
        setOpen={setOpenRegistrarCobro}
        venta={ventaSeleccionada}
      />
      <ModalConsultarPagos
        open={openConsultarPagos}
        setOpen={setOpenConsultarPagos}
      />
      <ModalCobroMultiple
        open={openCobroMultiple}
        setOpen={setOpenCobroMultiple}
      />
      <ModalImprimirTicketsMasivos
        open={openImprimirMasivo}
        setOpen={setOpenImprimirMasivo}
      />
    </ContenedorGeneral>
  )
}
