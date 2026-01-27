export default function CardInfoPermiso({
  title,
  value,
  className = '',
  icon,
}: {
  title: string
  value: number | string
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <div
      className={`flex gap-4 justify-center items-center px-4 py-2 border rounded-lg shadow-md w-full bg-white ${className}`}
    >
      {icon && <div className="text-2xl">{icon}</div>}
      <div className="flex flex-col flex-1">
        <h3 className='text-sm font-medium text-slate-600'>
          {title}
        </h3>
        <p className='text-2xl font-bold text-slate-800'>
          {typeof value === 'number' ? value.toLocaleString('en-US') : value}
        </p>
      </div>
    </div>
  )
}
