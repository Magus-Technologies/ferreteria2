import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import TableRecepcionesAlmacen from './_components/tables/table-recepciones-almacen'
import FiltersMisRecepciones from './_components/filters/filters-mis-recepciones'
import TableDetalleDeRecepcion from './_components/tables/table-detalle-de-recepcion'

export default async function MisRecepciones() {
  if (
    !(await can(
      permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_RECEPCIONES_INDEX
    ))
  )
    return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <FiltersMisRecepciones />
      <TableRecepcionesAlmacen />
      <TableDetalleDeRecepcion />
    </ContenedorGeneral>
  )
}
