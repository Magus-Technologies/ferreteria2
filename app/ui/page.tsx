import Image from 'next/image'
import BottomNavUI from './_components/nav/bottom-nav'
import TopNavUI from './_components/nav/top-nav'

export default function UIPage() {
  return (
    <>
      <TopNavUI className='animate-fade-down animate-ease-in-out' />

      {/* Contenedor principal - Responsivo */}
      <div className='flex-1 items-center justify-center flex flex-col
                      gap-3 sm:gap-4 md:gap-5 lg:gap-6
                      animate-fade animate-ease-in-out animate-delay-[250ms]
                      px-4 sm:px-6 md:px-8'>

        {/* Logo - Totalmente responsivo */}
        <Image
          src='/logo-horizontal.png'
          alt='Logo'
          width={500}
          height={500}
          className='w-72 h-auto sm:w-80 md:w-[28rem] lg:w-[32rem] xl:w-[36rem] 2xl:w-[40rem]
                     object-contain
                     max-w-[90vw]'
          priority
        />

        {/* Contenedor de efectos de gradiente - Responsivo */}
        <div className='w-full max-w-[20rem] sm:max-w-[28rem] md:max-w-[36rem] lg:max-w-[40rem] xl:max-w-[44rem]
                        relative h-2 sm:h-3'>

          {/* Gradiente principal indigo - Responsivo */}
          <div className='absolute
                         inset-x-8 sm:inset-x-12 md:inset-x-16 lg:inset-x-20
                         top-0
                         bg-gradient-to-r from-transparent via-indigo-500 to-transparent
                         h-[2px]
                         w-3/4
                         blur-sm' />
          <div className='absolute
                         inset-x-8 sm:inset-x-12 md:inset-x-16 lg:inset-x-20
                         top-0
                         bg-gradient-to-r from-transparent via-indigo-500 to-transparent
                         h-px
                         w-3/4' />

          {/* Gradiente secundario sky - Responsivo */}
          <div className='absolute
                         inset-x-16 sm:inset-x-24 md:inset-x-40 lg:inset-x-60
                         top-0
                         bg-gradient-to-r from-transparent via-sky-500 to-transparent
                         h-[5px]
                         w-1/4
                         blur-sm' />
          <div className='absolute
                         inset-x-16 sm:inset-x-24 md:inset-x-40 lg:inset-x-60
                         top-0
                         bg-gradient-to-r from-transparent via-sky-500 to-transparent
                         h-px
                         w-1/4' />
        </div>
      </div>

      <BottomNavUI className='animate-fade-up animate-ease-in-out animate-delay-[500ms]' />
    </>
  )
}
