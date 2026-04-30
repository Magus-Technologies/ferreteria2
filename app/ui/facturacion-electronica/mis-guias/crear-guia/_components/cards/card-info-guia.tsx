export default function CardInfoGuia({
  title,
  value,
  className,
  prefix = 'S/.',
  suffix = '',
  precision = 2,
  valueColor,
}: {
  title: string
  value: number
  className?: string
  prefix?: string
  suffix?: string
  precision?: number
  valueColor?: string
}) {
  return (
    <div
      className={`flex flex-col gap-1 p-4 rounded-lg bg-white shadow-sm border border-gray-200 ${className || ''}`}
    >
      <span className='text-xs font-medium text-gray-500 uppercase'>{title}</span>
      <span className={`text-2xl font-bold ${valueColor || 'text-cyan-600'}`}>
        {prefix ? `${prefix} ` : ''}{value.toFixed(precision)}{suffix ? ` ${suffix}` : ''}
      </span>
    </div>
  )
}
