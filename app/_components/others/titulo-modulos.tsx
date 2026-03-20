export default function TituloModulos({
  title,
  icon,
  children,
  extra,
}: {
  title: string
  icon: React.ReactNode
  children?: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div className='w-full flex flex-col sm:flex-row items-start sm:items-center justify-between
                    gap-3 sm:gap-4 md:gap-6 lg:gap-10 xl:gap-16'>
      <div className='w-full sm:w-auto min-w-0
                      text-xl sm:text-2xl md:text-3xl lg:text-4xl
                      font-bold text-slate-700
                      flex flex-wrap items-center gap-x-1 sm:gap-x-2 gap-y-2
                      [&>svg]:text-xl [&>svg]:sm:text-2xl [&>svg]:md:text-3xl [&>svg]:lg:text-4xl'>
        <span className='flex items-center gap-1 sm:gap-2 whitespace-nowrap'>
          {icon}
          {title}
        </span>
        {extra}
      </div>
      <div className='w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 lg:gap-8'>
        {children}
      </div>
    </div>
  )
}
