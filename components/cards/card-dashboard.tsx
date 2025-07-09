interface CardDashboardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  decimal?: number
}

export default function CardDashboard({
  title,
  value,
  prefix,
  suffix,
  icon,
  decimal = 2,
}: CardDashboardProps) {
  return (
    <div className='flex flex-col justify-center gap-1 bg-white px-6 py-3 rounded-2xl shadow-lg h-full'>
      <div className='flex items-center gap-4 text-slate-500'>
        {icon}
        <div className='text-nowrap font-semibold text-sm'>{title}</div>
      </div>
      <div className='text-nowrap text-2xl font-bold'>
        {prefix}
        {value.toLocaleString('en-US', {
          minimumFractionDigits: decimal,
          maximumFractionDigits: decimal,
        })}
        {suffix}
      </div>
    </div>
  )
}
