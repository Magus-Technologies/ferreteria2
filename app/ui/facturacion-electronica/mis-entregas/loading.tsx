export default function MisEntregasLoading() {
  return (
    <div
      className='flex flex-col gap-4 w-full animate-pulse'
      role='status'
      aria-label='Cargando entregas'
    >
      {/* Header skeleton */}
      <div className='flex gap-2'>
        <div className='h-10 w-64 rounded bg-slate-100' />
        <div className='h-10 w-40 rounded bg-slate-100' />
        <div className='h-10 w-40 rounded bg-slate-100' />
      </div>

      {/* Layout: tablas + panel lateral */}
      <div className='flex gap-4 w-full'>
        <div className='flex-1 min-w-0 flex flex-col gap-4'>
          <div className='h-[300px] rounded-xl bg-slate-50 border border-slate-100' />
          <div className='h-48 rounded-xl bg-slate-50 border border-slate-100' />
        </div>
        <div className='w-52 flex-shrink-0 flex flex-col gap-3'>
          <div className='h-24 rounded-lg bg-slate-50 border border-slate-100' />
          <div className='h-10 rounded-lg bg-slate-50 border border-slate-100' />
          <div className='h-10 rounded-lg bg-slate-50 border border-slate-100' />
          <div className='h-10 rounded-lg bg-slate-50 border border-slate-100' />
          <div className='h-10 rounded-lg bg-slate-50 border border-slate-100' />
        </div>
      </div>
    </div>
  )
}
