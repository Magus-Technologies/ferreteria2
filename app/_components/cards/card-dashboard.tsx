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
    <div className='flex flex-col justify-between bg-white px-4 py-4 rounded-xl shadow-md h-full'>
      {/* Header con título e icono */}
      <div className='flex items-start justify-between gap-2'>
        <div className='font-semibold text-lg leading-tight text-slate-600 flex-1'>
          {title}
        </div>
        <div className='flex items-center gap-2'>
          {icon && (
            <div className='flex-shrink-0 text-slate-500'>
              {icon}
            </div>
          )}
          {iconRight}
        </div>
      </div>
      
      {/* Contenido principal con valor */}
      <div className='flex items-end justify-start mt-4'>
        <div className='text-3xl font-bold text-slate-800'>
          {prefix}
          {value.toLocaleString('en-US', {
            minimumFractionDigits: decimal,
            maximumFractionDigits: decimal,
          })}
          {suffix}
        </div>
      </div>
    </div>
  )
}
