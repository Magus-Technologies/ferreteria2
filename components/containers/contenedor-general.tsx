export default function ContenedorGeneral({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='animate-fade animate-ease-in-out animate-delay-[250ms] size-full flex flex-col items-center px-8 pb-2 gap-4'>
      {children}
    </div>
  )
}
