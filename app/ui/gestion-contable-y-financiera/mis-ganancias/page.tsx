'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersMisGanancias from './_components/filters/filters-mis-ganancias'
import TableMisGanancias from './_components/tables/table-mis-ganancias'
import CardsInfoGanancias from './_components/cards/cards-info-ganancias'

export default function MisGananciasPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4 w-full'>
        <FiltersMisGanancias />

        {/* Layout: Cards a la derecha, Tabla a la izquierda */}
        <div className='flex gap-4 w-full'>
          {/* Tabla - Ocupa el espacio principal */}
          <div className='flex-1 h-[calc(100vh-280px)] min-w-0'>
            <TableMisGanancias />
          </div>

          {/* Cards - Columna vertical a la derecha */}
          <div className='w-80 flex-shrink-0'>
            <CardsInfoGanancias />
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
