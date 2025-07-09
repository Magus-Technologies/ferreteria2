import Image from 'next/image'
import BottomNavUI from './_components/nav/bottom-nav'
import TopNavUI from './_components/nav/top-nav'

export default function UIPage() {
  return (
    <>
      <TopNavUI className='animate-fade-down animate-ease-in-out' />
      <div className='flex-1 items-center justify-center flex flex-col gap-4 animate-fade animate-ease-in-out animate-delay-[250ms]'>
        <Image src='/logo-horizontal.png' alt='Logo' width={500} height={500} />
        <div className='w-[40rem] relative'>
          <div className='absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm' />
          <div className='absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4' />
          <div className='absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm' />
          <div className='absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4' />
        </div>
      </div>
      <BottomNavUI className='animate-fade-up animate-ease-in-out animate-delay-[500ms]' />
    </>
  )
}
