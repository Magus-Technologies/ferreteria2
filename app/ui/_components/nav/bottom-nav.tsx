'use client'

import { BiSolidReport } from 'react-icons/bi'
import { FaCalculator, FaWarehouse } from 'react-icons/fa6'
import { IoDocumentText } from 'react-icons/io5'
import ButtonBase from '~/components/buttons/button-base'
import { useRouter } from 'next/navigation'

export default function BottomNavUI({ className }: { className?: string }) {
  const router = useRouter()

  return (
    <div className={`px-8 py-10 flex justify-around gap-5 w-full ${className}`}>
      <ButtonBase
        size='lg'
        color='success'
        className='text-white w-80 text-balance flex items-center justify-center gap-6'
        onClick={() => router.push('/ui/gestion-comercial-e-inventario')}
      >
        <FaWarehouse size={80} />
        Gestión Comercial e Inventario
      </ButtonBase>
      <ButtonBase
        size='lg'
        color='warning'
        className='text-white w-80 text-balance flex items-center justify-center'
        onClick={() => router.push('/ui/facturacion-electronica')}
      >
        <IoDocumentText size={60} />
        Facturación Electrónica
      </ButtonBase>
      <ButtonBase
        size='lg'
        color='danger'
        className='text-white w-80 text-balance flex items-center justify-center gap-2'
        onClick={() => router.push('/ui/gestion-contable-y-financiera')}
      >
        <FaCalculator size={50} />
        Gestión Contable y Financiera
      </ButtonBase>
      <ButtonBase
        size='lg'
        color='info'
        className='text-white w-80 text-balance flex items-center justify-center gap-6'
        onClick={() => router.push('/ui/reportes')}
      >
        <BiSolidReport size={60} />
        Reportes
      </ButtonBase>
    </div>
  )
}
