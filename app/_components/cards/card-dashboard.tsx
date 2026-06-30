import Link from 'next/link'

interface CardDashboardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  decimal?: number
  href?: string
}

export default function CardDashboard({
  title,
  value,
  prefix,
  suffix,
  icon,
  iconRight,
  decimal = 2,
  href,
}: CardDashboardProps) {
  const content = (
    <div className='flex flex-col justify-between bg-white px-3 py-3 sm:px-4 sm:py-4 rounded-xl shadow-md h-full hover:shadow-lg transition-shadow'>
      {/* Header con título e icono */}
      <div className='flex items-start justify-between gap-2'>
        <div className='font-semibold text-xs sm:text-lg leading-tight text-slate-600 flex-1'>
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
      <div className='flex items-end justify-start mt-2 sm:mt-4'>
        <div className='text-sm sm:text-3xl font-bold text-slate-800'>
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

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
