import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import HeaderCrearCompra from './_components/others/header'
import BodyComprar from './_components/others/body-comprar'

export default async function CrearCompra() {
  if (!(await can(permissions.COMPRAS_CREATE))) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <HeaderCrearCompra />
      <BodyComprar />
    </ContenedorGeneral>
  )
}
