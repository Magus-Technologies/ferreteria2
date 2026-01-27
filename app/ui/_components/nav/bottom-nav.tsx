'use client'

import { getAllModules } from '~/lib/navigation'
import ButtonBase from '~/components/buttons/button-base'
import { useRouter } from 'next/navigation'
import usePermissionHook from '~/hooks/use-permission'
import { BiSolidReport } from 'react-icons/bi'
import { FaCalculator, FaWarehouse } from 'react-icons/fa6'
import { IoDocumentText } from 'react-icons/io5'
import { MdSettings } from 'react-icons/md'

// Mapa de iconos
const iconMap: Record<string, any> = {
  FaWarehouse,
  IoDocumentText,
  FaCalculator,
  BiSolidReport,
  MdSettings,
}

export default function BottomNavUI({ className }: { className?: string }) {
  const router = useRouter()
  const { can } = usePermissionHook()
  
  // Obtener módulos filtrados por permisos
  const modules = getAllModules().filter(m => can(m.permission))

  return (
    <div className={`px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10
                     flex flex-wrap justify-center items-stretch
                     gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8
                     w-full ${className}`}>
      {modules.map(module => {
        const Icon = iconMap[module.icon]
        
        return (
          <ButtonBase
            key={module.id}
            size='lg'
            color={module.color as any}
            className='w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)]
                       md:w-[calc(50%-0.5rem)]
                       lg:w-80 xl:w-96 2xl:w-[26rem]
                       text-balance flex flex-col sm:flex-row items-center justify-center
                       gap-2 sm:gap-3 md:gap-4 lg:gap-6
                       px-3 sm:px-4 md:px-5 lg:px-7 xl:px-8
                       py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8
                       text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                       min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem] lg:min-h-[9rem] xl:min-h-[10rem]'
            onClick={() => router.push(module.route)}
          >
            {Icon && <Icon className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl shrink-0' />}
            <span className='text-center sm:text-left leading-tight'>{module.name}</span>
          </ButtonBase>
        )
      })}
    </div>
  )
}
