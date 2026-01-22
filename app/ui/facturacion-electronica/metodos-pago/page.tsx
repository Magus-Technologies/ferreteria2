'use client'

import { Suspense } from 'react'
import { Spin } from 'antd'
import { FaCreditCard } from 'react-icons/fa'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import TableMetodosPago from './_components/table-metodos-pago'

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MetodosPagoPage() {
  const canAccess = usePermission(permissions.CAJA_LISTADO)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title='Métodos de Pago'
        icon={<FaCreditCard className='text-amber-600' />}
      />
      <div className='w-full mt-4'>
        <Suspense fallback={<ComponentLoading />}>
          <TableMetodosPago />
        </Suspense>
      </div>
    </ContenedorGeneral>
  )
}
