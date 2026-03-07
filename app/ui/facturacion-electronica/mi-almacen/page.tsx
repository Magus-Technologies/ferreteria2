'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexView from './_components/kardex-view'

export default function KardexPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_MI_ALMACEN_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <KardexView />
    </ContenedorGeneral>
  )
}
