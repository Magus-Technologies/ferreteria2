'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersComprasPorPagar from './_components/filters/filters-compras-por-pagar'
import TableComprasPorPagar from './_components/tables/table-compras-por-pagar'
import CardsInfoComprasPorPagar from './_components/cards/cards-info-compras-por-pagar'

export default function ComprasPorPagarPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4 w-full'>
        <FiltersComprasPorPagar />

        {/* Layout: Cards a la derecha, Tabla a la izquierda */}
        <div className='flex gap-4 w-full'>
          {/* Tabla - Ocupa el espacio principal */}
          <div className='flex-1 h-[calc(100vh-280px)] min-w-0'>
            <TableComprasPorPagar />
          </div>

          {/* Cards - Columna vertical a la derecha */}
          <div className='w-80 flex-shrink-0'>
            <CardsInfoComprasPorPagar />
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}