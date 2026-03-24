'use client'

interface ResumenCardItem {
  label: string
  value: string | number
  color?: 'green' | 'red' | 'blue' | 'default'
}

interface TabResumenCardsProps {
  items: ResumenCardItem[]
}

const colorMap = {
  green: 'text-emerald-600',
  red: 'text-red-500',
  blue: 'text-blue-600',
  default: 'text-slate-800',
}

export default function TabResumenCards({ items }: TabResumenCardsProps) {
  return (
    <div className='flex flex-col gap-3 w-[155px] flex-shrink-0'>
      {items.map((item, i) => (
        <div
          key={i}
          className='bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col gap-1'
        >
          <span className='text-[10px] uppercase tracking-wide text-slate-400 font-semibold'>
            {item.label}
          </span>
          <span className={`text-base font-bold ${colorMap[item.color || 'default']}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
