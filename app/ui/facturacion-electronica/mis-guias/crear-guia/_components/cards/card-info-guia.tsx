export default function CardInfoGuia({
  title,
  value,
  className,
  prefix = 'S/.',
  suffix = '',
  precision = 2,
  valueColor,
  trimDecimales = false,
}: {
  title: string
  value: number
  className?: string
  prefix?: string
  suffix?: string
  precision?: number
  valueColor?: string
  /**
   * Muestra hasta 2 decimales y sin ceros de relleno: 12 -> "12", 12.5 -> "12.5",
   * 12.456 -> "12.46". Para montos dejar en false (siempre 2 decimales fijos).
   */
  trimDecimales?: boolean
}) {
  const texto = trimDecimales
    ? String(Number(value.toFixed(2)))
    : value.toFixed(precision)

  return (
    <div
      className={`flex flex-col gap-1 p-2 sm:p-3 xl:p-4 rounded-lg bg-white shadow-sm border border-gray-200 ${className || ''}`}
    >
      <span className='text-[10px] sm:text-xs font-medium text-gray-500 uppercase'>{title}</span>
      <span className={`text-base sm:text-xl xl:text-2xl font-bold ${valueColor || 'text-cyan-600'}`}>
        {prefix ? `${prefix} ` : ''}{texto}{suffix ? ` ${suffix}` : ''}
      </span>
    </div>
  )
}
