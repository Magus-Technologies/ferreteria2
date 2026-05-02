'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersVentasPorCobrar from './_components/filters/filters-ventas-por-cobrar'
import TableVentasPorCobrar, { useStoreVentaSeleccionada, useStoreVentasFiltradas } from './_components/tables/table-ventas-por-cobrar'
import TableDetalleVenta from './_components/tables/table-detalle-venta'
import CardsInfoVentasPorCobrar from './_components/cards/cards-info-ventas-por-cobrar'
import ModalRegistrarCobro from './_components/modals/modal-registrar-cobro'
import ModalConsultarPagos from './_components/modals/modal-consultar-pagos'
import { useState, useEffect, useCallback } from 'react'
import { App } from 'antd'
import { FaMoneyCheckAlt, FaListAlt, FaCalendarCheck, FaUsers, FaPrint } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import ModalCobroMultiple from './_components/modals/modal-cobro-multiple'
import ModalImprimirTicketsMasivos from './_components/modals/modal-imprimir-tickets-masivos'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import dayjs from 'dayjs'

export default function VentasPorCobrarPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)
  const [openRegistrarCobro, setOpenRegistrarCobro] = useState(false)
  const [openConsultarPagos, setOpenConsultarPagos] = useState(false)
  const [openCobroMultiple, setOpenCobroMultiple] = useState(false)
  const [openImprimirMasivo, setOpenImprimirMasivo] = useState(false)
  const [reportePdfUrl, setReportePdfUrl] = useState<string | null>(null)
  const [reporteModalOpen, setReporteModalOpen] = useState(false)
  const [reporteLoading, setReporteLoading] = useState(false)
  const ventaSeleccionada = useStoreVentaSeleccionada(state => state.venta)
  const ventasFiltradas = useStoreVentasFiltradas(state => state.ventas)
  const { message } = App.useApp()

  if (!canAccess) return <NoAutorizado />

  const handleRegistrarCobro = () => {
    if (!ventaSeleccionada) {
      message.warning('Seleccione una venta primero')
      return
    }
    setOpenRegistrarCobro(true)
  }

  // Función para calcular el total de una venta
  const calcularTotalVenta = useCallback((venta: any) => {
    return (venta.productos_por_almacen || []).reduce((acc: number, item: any) => {
      for (const u of item.unidades_derivadas ?? []) {
        const precio = Number(u.precio ?? 0)
        const cantidad = Number(u.cantidad ?? 0)
        const descuento = Number(u.descuento ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (precio * cantidad) - descuento
        acc += montoLinea
      }
      return acc
    }, 0)
  }, [])

  // Función para calcular días de mora
  const calcularMora = useCallback((venta: any): number => {
    const ref = venta.fecha_vencimiento || venta.fecha
    return dayjs().startOf('day').diff(dayjs(ref).startOf('day'), 'days')
  }, [])

  // Manejar impresión del reporte (tickets de todos los cobros)
  const handleImprimirReporte = useCallback(async () => {
    if (!ventasFiltradas || ventasFiltradas.length === 0) {
      message.warning('No hay ventas para imprimir')
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    setReporteModalOpen(true)
    setReporteLoading(true)
    setReportePdfUrl(null)

    try {
      // Enviar solo los IDs de las ventas filtradas
      const ventaIds = ventasFiltradas.map((venta) => venta.id)

      const res = await fetch(`${API_URL}/pdf/reporte-ventas-por-cobrar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/pdf',
        },
        body: JSON.stringify({
          venta_ids: ventaIds,
        }),
      })

      if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setReportePdfUrl(url)
    } catch (err) {
      console.error('Error al generar reporte:', err)
      message.error('Error al generar los tickets de cobro')
      setReporteModalOpen(false)
    } finally {
      setReporteLoading(false)
    }
  }, [ventasFiltradas, message])

  // Limpiar URL al cerrar modal de reporte
  const handleCloseReporteModal = useCallback((v: boolean) => {
    setReporteModalOpen(v)
    if (!v && reportePdfUrl) {
      URL.revokeObjectURL(reportePdfUrl)
      setReportePdfUrl(null)
    }
  }, [reportePdfUrl])

  // Escuchar evento de impresión desde los filtros
  useEffect(() => {
    const handleEvent = () => {
      handleImprimirReporte()
    }
    window.addEventListener('imprimirReporteVentasPorCobrar', handleEvent)
    return () => {
      window.removeEventListener('imprimirReporteVentasPorCobrar', handleEvent)
    }
  }, [handleImprimirReporte])

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
            <div className='flex flex-col gap-2 mt-0'>
              <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full h-10 border-green-500 !text-green-700 font-semibold hover:bg-green-50'
                onClick={handleRegistrarCobro}
              >
                <FaMoneyCheckAlt size={18} />
                Registrar Cobros
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

      {/* Modal para mostrar tickets de cobro */}
      <ModalShowDoc
        open={reporteModalOpen}
        setOpen={handleCloseReporteModal}
        nro_doc='Tickets de Cobro de Ventas Filtradas'
        esTicket={true}
        backendPdfUrl={reportePdfUrl}
        backendPdfLoading={reporteLoading}
      >
        <></>
      </ModalShowDoc>
    </ContenedorGeneral>
  )
}
