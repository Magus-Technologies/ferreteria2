'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import KardexInventarioView from './_components/kardex-inventario-view'

export default function KardexInventarioPage() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_KARDEX_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <KardexInventarioView />
    </ContenedorGeneral>
  )
}
