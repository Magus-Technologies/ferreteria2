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
    <div className='w-full flex items-center justify-between'>
      <div className='text-4xl font-bold text-slate-700 flex items-center gap-2 text-nowrap'>
        {icon}
        {title}
        {extra}
      </div>
      {children}
    </div>
  )
}
