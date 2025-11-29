import { TipoMoneda } from '@prisma/client'

export default function CardInfoVenta({
  title,
  value,
  className = '',
  moneda = TipoMoneda.Soles,
}: {
  title: string
  value: number
  className?: string
  moneda?: TipoMoneda
}) {
  return (
    <div
      className={`flex gap-4 justify-center px-4 py-2 border rounded-lg shadow-md w-full bg-white ${className}`}
    >
      <h3 className='text-base font-medium text-right text-slate-600 text-nowrap'>
        {title}:
      </h3>
      <p className='text-xl font-bold text-left text-slate-800 text-nowrap'>
        {moneda === TipoMoneda.Soles ? 'S/.' : '$.'}{' '}
        {value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  )
}
