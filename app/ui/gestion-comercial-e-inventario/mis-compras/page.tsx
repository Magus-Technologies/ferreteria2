import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

export default async function MisCompras() {
  if (
    !(await can(permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_COMPRAS_INDEX))
  )
    return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div></div>
    </ContenedorGeneral>
  )
}
