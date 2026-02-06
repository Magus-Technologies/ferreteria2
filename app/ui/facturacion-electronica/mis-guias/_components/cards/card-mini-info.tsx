export default function CardMiniInfo({
  title,
  value,
  className = '',
  valueColor = 'text-slate-800',
}: {
  title: string
  value: number
  className?: string
  valueColor?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-3 py-1.5 border rounded-lg shadow-md w-full bg-white ${className}`}
    >
      <h3 className='text-xs font-medium text-center text-slate-600'>
        {title}
      </h3>
      <p className={`text-sm font-bold text-nowrap ${valueColor}`}>
        {value}
      </p>
    </div>
  )
}
