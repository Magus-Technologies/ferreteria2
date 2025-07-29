'use client'

import { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'
import { BiSolidReport } from 'react-icons/bi'
import { FaCalculator, FaSignOutAlt, FaWarehouse } from 'react-icons/fa'
import { IoDocumentText } from 'react-icons/io5'
import { MdOutlineMenuOpen } from 'react-icons/md'
import { signOut } from 'next-auth/react'
import DropdownBase from '~/components/dropdown/dropdown-base'

export default function DropdownUser() {
  const router = useRouter()

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: 'Menú Principal',
      extra: <MdOutlineMenuOpen className='text-cyan-500' size={20} />,
      onClick: () => router.push('/ui'),
    },
    {
      type: 'divider',
    },
    {
      key: '1-1',
      label: 'Gestión Comercial e Inventario',
      extra: <FaWarehouse className='text-emerald-600' size={15} />,
      onClick: () => router.push('/ui/gestion-comercial-e-inventario'),
    },
    {
      key: '1-2',
      label: 'Facturación Electrónica',
      extra: <IoDocumentText className='text-amber-600' size={15} />,
      onClick: () => router.push('/ui/facturacion-electronica'),
    },
    {
      key: '1-3',
      label: 'Gestión Contable y Financiera',
      extra: <FaCalculator className='text-rose-700' size={15} />,
      onClick: () => router.push('/ui/gestion-contable-y-financiera'),
    },
    {
      key: '1-4',
      label: 'Reportes',
      extra: <BiSolidReport className='text-cyan-600' size={15} />,
      onClick: () => router.push('/ui/reportes'),
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      label: 'Cambiar Contraseña',
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: 'Cerrar Sesión',
      className: '!text-red-500',
      extra: <FaSignOutAlt className='text-red-500' />,
      onClick: () => signOut(),
    },
  ]

  return (
    <DropdownBase menu={{ items }}>
      <span className='font-bold'>Hola, Elias</span>
    </DropdownBase>
  )
}
