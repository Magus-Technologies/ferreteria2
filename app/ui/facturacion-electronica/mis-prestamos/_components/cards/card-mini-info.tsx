export default function CardMiniInfo({
  title,
  value,
  className = '',
  valueColor = 'text-slate-800',
  isNumber = true,
}: {
  title: string
  value: number | string
  className?: string
  valueColor?: string
  isNumber?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-2 border rounded-lg shadow-md w-full bg-white ${className}`}
    >
      <h3 className='text-xs font-medium text-center text-slate-600'>
        {title}
      </h3>
      {isNumber ? (
        <p className={`text-sm font-bold text-nowrap ${valueColor}`}>
          {typeof value === 'number'
            ? value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            : value}
        </p>
      ) : (
        <p className={`text-sm font-bold text-nowrap ${valueColor}`}>
          {value}
        </p>
      )}
    </div>
  )
}
