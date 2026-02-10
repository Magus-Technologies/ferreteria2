export default function ContenedorGeneral({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  // Detectar si className incluye h-full y ajustar padding para no romper el layout
  const hasHeightFull = className.includes('h-full')
  
  return (
    <div className={`animate-fade animate-ease-in-out animate-delay-[250ms] w-full flex flex-col items-center ${hasHeightFull ? 'pt-2 pb-1' : 'pt-2 sm:pt-3 md:pt-4 lg:pt-3 pb-2 lg:pb-1'} gap-2 sm:gap-3 md:gap-4 ${className}`}>
      {children}
    </div>
  )
}
