'use client'

import { useState, Suspense } from 'react'
import { Spin } from 'antd'
import { FaCreditCard, FaArrowLeft } from 'react-icons/fa'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import TableMetodosPagoUnificado from './_components/table-metodos-pago-unificado'
import type { MetodoDePago } from '~/lib/api/metodo-de-pago'

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MetodosPagoPage() {
  const canAccess = usePermission(permissions.CAJA_LISTADO)
  const [selectedBanco, setSelectedBanco] = useState<MetodoDePago | null>(null)

  if (!canAccess) return <NoAutorizado />

  /* Si hay un banco seleccionado, mostrar vista detallada
  if (selectedBanco) {
    return <ResumenDetalleBanco banco={selectedBanco} onClose={() => setSelectedBanco(null)} />
  }*/

  // Vista principal de métodos de pago
  return (
    <ContenedorGeneral>
      <TituloModulos
        title='Métodos de Pago'
        icon={<FaCreditCard className='text-amber-600' />}
      />
      <div className='w-full mt-4'>
        <Suspense fallback={<ComponentLoading />}>
          <TableMetodosPagoUnificado onBancoDoubleClick={setSelectedBanco} />
        </Suspense>
      </div>
    </ContenedorGeneral>
  )
}
