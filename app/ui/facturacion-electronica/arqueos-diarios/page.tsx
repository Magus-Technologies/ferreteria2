'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import ArqueosDiariosView from '~/app/ui/facturacion-electronica/arqueos-diarios/_components/arqueos-diarios-view'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

export default function ArqueosDiariosPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_ARQUEOS_DIARIOS_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral className='items-stretch max-w-full'>
      <div className='w-full'>
        <ArqueosDiariosView />
      </div>
    </ContenedorGeneral>
  )
}
