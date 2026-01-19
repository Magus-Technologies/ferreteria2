'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import { FaCashRegister } from 'react-icons/fa'
import TableCajasPrincipales from './_components/table-cajas-principales'
import { Suspense } from 'react'
import { Spin } from 'antd'

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function GestionCajas() {
  const canAccess = usePermission(permissions.CAJA_LISTADO)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title='Gestión de Cajas'
        icon={<FaCashRegister className='text-emerald-600' />}
      />
      <div className='w-full mt-4'>
        <Suspense fallback={<ComponentLoading />}>
          <TableCajasPrincipales />
        </Suspense>
      </div>
    </ContenedorGeneral>
  )
}
