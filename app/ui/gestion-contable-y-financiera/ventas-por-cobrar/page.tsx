'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersVentasPorCobrar from './_components/filters/filters-ventas-por-cobrar'
import TableVentasPorCobrar from './_components/tables/table-ventas-por-cobrar'
import TableDetalleVenta from './_components/tables/table-detalle-venta'
import CardsInfoVentasPorCobrar from './_components/cards/cards-info-ventas-por-cobrar'

export default function VentasPorCobrarPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)

  if (!canAccess) return <NoAutorizado />

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
          <div className='w-80 flex-shrink-0'>
            <CardsInfoVentasPorCobrar />
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
