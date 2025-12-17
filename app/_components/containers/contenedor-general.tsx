export default function ContenedorGeneral({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='animate-fade animate-ease-in-out animate-delay-[250ms] w-full flex flex-col items-center pb-2 gap-4'>
      {children}
    </div>
  )
}
