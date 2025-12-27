export default function CardInfoGuia({
  title,
  value,
  className,
}: {
  title: string
  value: number
  className?: string
}) {
  return (
    <div
      className={`flex flex-col gap-1 p-4 rounded-lg bg-white shadow-sm border border-gray-200 ${className || ''}`}
    >
      <span className='text-xs font-medium text-gray-500 uppercase'>{title}</span>
      <span className='text-2xl font-bold text-cyan-600'>
        S/. {value.toFixed(2)}
      </span>
    </div>
  )
}
