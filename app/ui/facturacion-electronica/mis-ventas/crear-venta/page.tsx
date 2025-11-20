import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import BodyVender from './_components/others/body-vender'
import HeaderCrearVenta from './_components/others/header-crear-venta'

export default async function CrearVenta() {
  if (!(await can(permissions.VENTA_CREATE))) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <HeaderCrearVenta />
      <BodyVender />
    </ContenedorGeneral>
  )
}
