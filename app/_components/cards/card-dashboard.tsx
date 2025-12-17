interface CardDashboardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  decimal?: number
}

export default function CardDashboard({
  title,
  value,
  prefix,
  suffix,
  icon,
  iconRight,
  decimal = 2,
}: CardDashboardProps) {
  return (
    <div className='flex flex-col justify-center gap-0 bg-white px-3 py-1.5 rounded-xl shadow-md h-full'>
      <div className='flex items-center justify-between gap-1.5'>
        <div className='flex items-center gap-1.5 text-slate-500'>
          {icon}
          <div className='font-semibold text-[10px] leading-tight'>{title}</div>
        </div>
        {iconRight}
      </div>
      <div className='text-base font-bold mt-0.5'>
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
