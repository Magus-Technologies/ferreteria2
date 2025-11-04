import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import FiltersMisCompras from './_components/filters/filters-mis-compras'
import TableMisCompras from './_components/tables/table-mis-compras'
import TableDetalleDeCompraMisCompras from './_components/tables/table-detalle-de-compra-mis-compras'

export default async function MisCompras() {
  if (
    !(await can(permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_COMPRAS_INDEX))
  )
    return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <FiltersMisCompras />
      <TableMisCompras />
      <TableDetalleDeCompraMisCompras />
    </ContenedorGeneral>
  )
}
