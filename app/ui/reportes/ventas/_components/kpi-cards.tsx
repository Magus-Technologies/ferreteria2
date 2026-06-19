'use client'

type Resumen = {
  ventas?: number
  ganancia?: number
  costo?: number
  total_transacciones?: number
}

type Props = {
  resumen: Resumen | undefined
  loading: boolean
}

function fmt(val?: number) {
  if (val === undefined || val === null) return 'S/. 0.00'
  return `S/. ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function KpiCards({ resumen, loading }: Props) {
  const cards = [
    { label: 'Total Ventas', value: fmt(resumen?.ventas), color: 'text-slate-800' },
    { label: 'Ganancia', value: fmt(resumen?.ganancia), color: 'text-green-600' },
    { label: 'Costo', value: fmt(resumen?.costo), color: 'text-slate-600' },
    { label: 'Transacciones', value: String(resumen?.total_transacciones ?? 0), color: 'text-blue-600' },
  ]

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 w-full'>
      {cards.map(({ label, value, color }) => (
        <div key={label} className='bg-white rounded-lg border border-slate-200 p-4'>
          <span className='text-xs text-slate-500 uppercase font-semibold'>{label}</span>
          {loading ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse mt-1' />
          ) : (
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
          )}
        </div>
      ))}
    </div>
  )
}
