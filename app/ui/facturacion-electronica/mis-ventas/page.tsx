import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import FiltersMisVentas from './_components/filters/filters-mis-ventas'
import TableMisVentas from './_components/tables/table-mis-ventas'
import TableDetalleVenta from './_components/tables/table-detalle-venta'

export default async function MisVentas() {
  if (!(await can(permissions.VENTA_LISTADO))) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <FiltersMisVentas />
        <div className='mt-4 w-full'>
          <TableMisVentas />
          <TableDetalleVenta />
        </div>
      </div>
    </ContenedorGeneral>
  )
}
