export default function ContenedorGeneral({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`animate-fade animate-ease-in-out animate-delay-[250ms] w-full flex flex-col items-center pt-2 sm:pt-3 md:pt-4 lg:pt-3 pb-2 lg:pb-1 gap-2 sm:gap-3 md:gap-4 ${className}`}>
      {children}
    </div>
  )
}
