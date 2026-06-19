'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts'

type DataPoint = { mes: string; ventas: number; ganancia: number }

type Props = {
  loading: boolean
  datos: DataPoint[]
}

export default function GraficoVentas({ loading, datos }: Props) {
  return (
    <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 w-full'>
      <h3 className='font-bold text-slate-700 text-sm uppercase'>Gráfico de Ventas</h3>
      <p className='text-xs text-slate-400 mb-4'>Ventas y ganancia por mes</p>

      {loading ? (
        <div className='h-[350px] bg-slate-50 rounded flex items-center justify-center'>
          <span className='text-slate-400 text-sm'>Cargando gráfico...</span>
        </div>
      ) : datos.length === 0 ? (
        <div className='h-[350px] bg-slate-50 rounded flex items-center justify-center'>
          <span className='text-slate-400 text-sm'>No hay datos de ventas en el periodo seleccionado</span>
        </div>
      ) : (
        <ResponsiveContainer width='100%' height={350}>
          <AreaChart data={datos}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis dataKey='mes' tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `S/. ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend />
            <Area type='monotone' dataKey='ventas' name='Ventas' stroke='#ef4444' fill='#ef444420' strokeWidth={2} />
            <Area type='monotone' dataKey='ganancia' name='Ganancia' stroke='#3b82f6' fill='#3b82f620' strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
