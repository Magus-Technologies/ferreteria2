'use client'

import { Tabs } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import FiltersComisiones from './_components/filters/filters-comisiones'
import CardsResumenComisiones from './_components/cards/cards-resumen-comisiones'
import TableComisionesPorVendedor from './_components/tables/table-comisiones-por-vendedor'
import TableHistorialPagos from './_components/tables/table-historial-pagos'

export default function ComisionesPage() {
  const canAccess = usePermission(permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX)
  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='flex flex-col gap-4 w-full'>
        <FiltersComisiones />
        <CardsResumenComisiones />

        <Tabs
          defaultActiveKey='por-vendedor'
          items={[
            {
              key: 'por-vendedor',
              label: 'Comisiones por Vendedor',
              children: (
                <div className='h-[calc(100vh-400px)] w-full'>
                  <TableComisionesPorVendedor />
                </div>
              ),
            },
            {
              key: 'historial',
              label: 'Historial de Pagos',
              children: (
                <div className='h-[calc(100vh-400px)] w-full'>
                  <TableHistorialPagos />
                </div>
              ),
            },
          ]}
        />
      </div>
    </ContenedorGeneral>
  )
}
