'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { Suspense } from 'react'
import FiltersMisGastos from './_components/filters/filters-mis-gastos'
import CardsInfoMisGastos from './_components/cards/cards-info-mis-gastos'
import TableMisGastos from './_components/tables/table-mis-gastos'

export default function MisGastosPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4 w-full'>
        <Suspense fallback={<div>Cargando filtros...</div>}>
          <FiltersMisGastos />
        </Suspense>

        {/* Layout: Tabla a la izquierda, Cards a la derecha */}
        <div className='flex gap-4 w-full'>
          {/* Tabla - Ocupa el espacio principal */}
          <div className='flex-1 h-[calc(100vh-280px)] min-w-0'>
            <Suspense fallback={<div>Cargando tabla...</div>}>
              <TableMisGastos />
            </Suspense>
          </div>

          {/* Cards - Columna vertical a la derecha */}
          <div className='w-80 flex-shrink-0'>
            <Suspense fallback={<div>Cargando información...</div>}>
              <CardsInfoMisGastos />
            </Suspense>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}