export default function FacturacionLoading() {
  return (
    <div
      className='flex flex-col gap-2 sm:gap-3 md:gap-4 w-full animate-pulse'
      role='status'
      aria-label='Cargando dashboard'
    >
      {/* Header skeleton */}
      <div className='flex items-center gap-3 mb-2'>
        <div className='h-6 w-6 rounded bg-slate-200' />
        <div className='h-6 w-32 rounded bg-slate-200' />
      </div>

      {/* Cards superiores */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12'>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-24 sm:h-28 rounded-xl bg-slate-100 border border-slate-200'
          />
        ))}
      </div>

      {/* Gráficos */}
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 mt-2'>
        {/* Columna izquierda */}
        <div className='flex flex-col gap-3 sm:gap-4 md:gap-5'>
          <div className='h-56 sm:h-64 rounded-xl bg-slate-100 border border-slate-200' />
          <div className='h-56 sm:h-64 rounded-xl bg-slate-100 border border-slate-200' />
        </div>

        {/* Columna derecha 2x2 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8'>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-56 sm:h-64 rounded-xl bg-slate-100 border border-slate-200'
            />
          ))}
        </div>
      </div>
    </div>
  )
}
