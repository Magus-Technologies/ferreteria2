import Image from 'next/image'

export default function UILoading() {
  return (
    <div
      className='relative h-dvh w-dvw overflow-hidden flex items-center justify-center bg-white'
      role='status'
      aria-label='Verificando sesión'
    >
      <div className='text-center'>
        <Image
          src='/logo-horizontal.svg'
          alt='Mi Redentor'
          width={350}
          height={300}
          priority
          className='w-56 sm:w-64 md:w-80 h-auto mx-auto'
        />
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mt-6' />
      </div>
    </div>
  )
}
