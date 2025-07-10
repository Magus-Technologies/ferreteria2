export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='relative h-dvh w-dvw overflow-hidden flex flex-col items-center justify-center min-w-fit'>
      <div className='absolute top-0 z-[-2] size-full bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]'></div>
      {children}
    </div>
  )
}
