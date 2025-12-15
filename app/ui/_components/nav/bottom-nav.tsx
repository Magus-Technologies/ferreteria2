'use client'

import { BiSolidReport } from 'react-icons/bi'
import { FaCalculator, FaWarehouse } from 'react-icons/fa6'
import { IoDocumentText } from 'react-icons/io5'
import ButtonBase from '~/components/buttons/button-base'
import { useRouter } from 'next/navigation'

export default function BottomNavUI({ className }: { className?: string }) {
  const router = useRouter()

  return (
    <div className={`px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10
                     flex flex-wrap justify-center items-stretch
                     gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8
                     w-full ${className}`}>

      {/* Botón 1: Gestión Comercial */}
      <ButtonBase
        size='lg'
        color='success'
        className='w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)]
                   md:w-[calc(50%-0.5rem)]
                   lg:w-80 xl:w-96 2xl:w-[26rem]
                   text-balance flex flex-col sm:flex-row items-center justify-center
                   gap-2 sm:gap-3 md:gap-4 lg:gap-6
                   px-3 sm:px-4 md:px-5 lg:px-7 xl:px-8
                   py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8
                   text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                   min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem] lg:min-h-[9rem] xl:min-h-[10rem]'
        onClick={() => router.push('/ui/gestion-comercial-e-inventario')}
      >
        <FaWarehouse className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl shrink-0' />
        <span className='text-center sm:text-left leading-tight'>Gestión Comercial e Inventario</span>
      </ButtonBase>

      {/* Botón 2: Facturación */}
      <ButtonBase
        size='lg'
        color='warning'
        className='w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)]
                   md:w-[calc(50%-0.5rem)]
                   lg:w-80 xl:w-96 2xl:w-[26rem]
                   text-balance flex flex-col sm:flex-row items-center justify-center
                   gap-2 sm:gap-3 md:gap-4 lg:gap-6
                   px-3 sm:px-4 md:px-5 lg:px-7 xl:px-8
                   py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8
                   text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                   min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem] lg:min-h-[9rem] xl:min-h-[10rem]'
        onClick={() => router.push('/ui/facturacion-electronica')}
      >
        <IoDocumentText className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl shrink-0' />
        <span className='text-center sm:text-left leading-tight'>Facturación Electrónica</span>
      </ButtonBase>

      {/* Botón 3: Gestión Contable */}
      <ButtonBase
        size='lg'
        color='danger'
        className='w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)]
                   md:w-[calc(50%-0.5rem)]
                   lg:w-80 xl:w-96 2xl:w-[26rem]
                   text-balance flex flex-col sm:flex-row items-center justify-center
                   gap-2 sm:gap-3 md:gap-4 lg:gap-6
                   px-3 sm:px-4 md:px-5 lg:px-7 xl:px-8
                   py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8
                   text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                   min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem] lg:min-h-[9rem] xl:min-h-[10rem]'
        onClick={() => router.push('/ui/gestion-contable-y-financiera')}
      >
        <FaCalculator className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl shrink-0' />
        <span className='text-center sm:text-left leading-tight'>Gestión Contable y Financiera</span>
      </ButtonBase>

      {/* Botón 4: Reportes */}
      <ButtonBase
        size='lg'
        color='info'
        className='w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)]
                   md:w-[calc(50%-0.5rem)]
                   lg:w-80 xl:w-96 2xl:w-[26rem]
                   text-balance flex flex-col sm:flex-row items-center justify-center
                   gap-2 sm:gap-3 md:gap-4 lg:gap-6
                   px-3 sm:px-4 md:px-5 lg:px-7 xl:px-8
                   py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8
                   text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                   min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem] lg:min-h-[9rem] xl:min-h-[10rem]'
        onClick={() => router.push('/ui/reportes')}
      >
        <BiSolidReport className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl shrink-0' />
        <span className='text-center sm:text-left leading-tight'>Reportes</span>
      </ButtonBase>
    </div>
  )
}
