'use client'

import { FaDollarSign } from 'react-icons/fa'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'

const ventasMensuales = [
  { mes: 'ENE', ventas: 45000, utilidad: 12000 },
  { mes: 'FEB', ventas: 59789, utilidad: 18500 },
  { mes: 'MAR', ventas: 38000, utilidad: 9800 },
  { mes: 'ABR', ventas: 52000, utilidad: 15200 },
  { mes: 'MAY', ventas: 48000, utilidad: 13500 },
  { mes: 'JUN', ventas: 61000, utilidad: 19000 },
  { mes: 'JUL', ventas: 55000, utilidad: 16800 },
  { mes: 'AGO', ventas: 42000, utilidad: 11200 },
  { mes: 'SEP', ventas: 67000, utilidad: 21000 },
  { mes: 'OCT', ventas: 58000, utilidad: 17500 },
  { mes: 'NOV', ventas: 72000, utilidad: 23000 },
  { mes: 'DIC', ventas: 85000, utilidad: 28000 },
]

const reportesAvanzados = [
  'Ventas',
  'Ventas por Producto',
  'Ventas por Vendedor',
  'Detalle de Ventas',
  'Resumen Detallado de Ventas',
  'Detalle de Ventas por Marca',
  'Detalle Ventas Agrupados por Categoría',
  'Cotizaciones',
  'Detalle de Cotizaciones',
]

export default function ReporteVentasPage() {
  const canAccess = usePermission(permissions.REPORTES_VENTAS_INDEX)

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Ventas"
        icon={<FaDollarSign className="text-rose-500" />}
      />

      {/* Gráfico de Ventas */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Grafico de Ventas</h3>
        <p className='text-xs text-slate-400 mb-4'>Montos totales por meses</p>

        <ResponsiveContainer width='100%' height={350}>
          <AreaChart data={ventasMensuales}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis dataKey='mes' tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `S/. ${value.toLocaleString()}`}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend />
            <Area
              type='monotone'
              dataKey='ventas'
              name='Ventas'
              stroke='#ef4444'
              fill='#ef444420'
              strokeWidth={2}
            />
            <Area
              type='monotone'
              dataKey='utilidad'
              name='Utilidad'
              stroke='#3b82f6'
              fill='#3b82f620'
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Reportes Avanzados */}
      <div className='mt-8 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-1'>Reportes Avanzados</h3>
        <div className='bg-slate-200 text-slate-600 text-xs font-bold uppercase px-3 py-2 rounded-t-lg'>
          Ventas
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mt-3'>
          {reportesAvanzados.map((titulo) => (
            <CardReporteAvanzado key={titulo} titulo={titulo} />
          ))}
        </div>
      </div>
    </ContenedorGeneral>
  )
}
