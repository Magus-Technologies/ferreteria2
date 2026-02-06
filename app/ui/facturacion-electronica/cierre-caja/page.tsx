import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import { FaCashRegister } from 'react-icons/fa'
import CierreCajaView from './_components/cierre-caja-view'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { serverValidatePermission } from '~/utils/server-validate-permission'

export default async function CierreCajaPage() {
  const canCerrarCaja = await serverValidatePermission(permissions.CAJA_UPDATE)

  if (!canCerrarCaja) {
    return <NoAutorizado />
  }

  return (
    <ContenedorGeneral>
      <TituloModulos
        title='Cierre de Caja'
        icon={<FaCashRegister className='text-rose-600' />}
      />
      <div className='mt-4'>
        <CierreCajaView />
      </div>
    </ContenedorGeneral>
  )
}
