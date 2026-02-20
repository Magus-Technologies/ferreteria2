'use client'

import { FaFileInvoice } from 'react-icons/fa'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'

const reportesAvanzados = [
  'Balance General',
  'Estado de Resultados',
  'Libro Diario',
  'Libro Mayor',
  'Registro de Ventas',
  'Registro de Compras',
  'Flujo de Caja',
  'Libro de Inventarios y Balances',
]

export default function ReporteContablesPage() {
  const canAccess = usePermission(permissions.REPORTES_FINANCIEROS_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Contables"
        icon={<FaFileInvoice className="text-emerald-600" />}
      />

      <div className='mt-6 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-3'>Reportes Avanzados</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
          {reportesAvanzados.map((titulo) => (
            <CardReporteAvanzado key={titulo} titulo={titulo} />
          ))}
        </div>
      </div>
    </ContenedorGeneral>
  )
}
