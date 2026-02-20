'use client'

import { FaUsers } from 'react-icons/fa'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'

const topClientes = [
  { xAxis: 'Cliente 1', monto: 25000 },
  { xAxis: 'Cliente 2', monto: 18500 },
  { xAxis: 'Cliente 3', monto: 15200 },
  { xAxis: 'Cliente 4', monto: 12800 },
  { xAxis: 'Cliente 5', monto: 9500 },
  { xAxis: 'Cliente 6', monto: 7200 },
  { xAxis: 'Cliente 7', monto: 5800 },
  { xAxis: 'Cliente 8', monto: 4100 },
  { xAxis: 'Cliente 9', monto: 3200 },
  { xAxis: 'Cliente 10', monto: 2500 },
]

const reportesAvanzados = [
  'Clientes',
  'Cuentas por Cobrar',
  'Historial de Clientes',
  'Clientes por Zona',
  'Ranking de Clientes',
]

export default function ReporteClientesPage() {
  const canAccess = usePermission(permissions.REPORTES_CLIENTES_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Clientes"
        icon={<FaUsers className="text-blue-500" />}
      />

      {/* Gráfico de Clientes */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Top Clientes</h3>
        <p className='text-xs text-slate-400 mb-4'>Clientes con mayor monto de compras</p>

        <ResponsiveContainer width='100%' height={350}>
          <BarChart data={topClientes}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis dataKey='xAxis' tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `S/. ${value.toLocaleString()}`}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar dataKey='monto' name='Monto' fill='#3b82f6' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reportes Avanzados */}
      <div className='mt-8 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-3'>Reportes Avanzados</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
          {reportesAvanzados.map((titulo) => (
            <CardReporteAvanzado key={titulo} titulo={titulo} />
          ))}
        </div>
      </div>
    </ContenedorGeneral>
  )
}
