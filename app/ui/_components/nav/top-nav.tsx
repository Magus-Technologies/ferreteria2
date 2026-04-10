'use client'

import { MenuProps } from 'antd/lib'
import { FaSignOutAlt, FaBell, FaPlus } from 'react-icons/fa'
import { FaCheck } from 'react-icons/fa6'
import { useRouter } from 'next/navigation'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { useAuth } from '~/lib/auth-context'
import { useModalProveedoresDesactivados } from '~/app/_stores/store-modal-proveedores-desactivados'
import { useModalConfiguraciones } from '~/app/_stores/store-modal-configuraciones'
import dynamic from 'next/dynamic'

const ModalProveedoresDesactivados = dynamic(() => import('~/app/_components/modals/modal-proveedores-desactivados'), { ssr: false })
const ModalConfiguraciones = dynamic(() => import('~/app/_components/modals/modal-configuraciones'), { ssr: false })
const ModalGestionarAlmacenes = dynamic(() => import('~/app/ui/_components/modals/modal-gestionar-almacenes'), { ssr: false })
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'

export default function TopNavUI({ className }: { className?: string }) {
  const { logout, user } = useAuth()
  const router = useRouter()
  const { openModal } = useModalProveedoresDesactivados()
  const { openModal: openConfiguraciones } = useModalConfiguraciones()
  const almacen_id = useStoreAlmacen(s => s.almacen_id)
  const setAlmacenId = useStoreAlmacen(s => s.setAlmacenId)
  const [openGestionAlmacenes, setOpenGestionAlmacenes] = useState(false)

  const { data: almacenes } = useQuery({
    queryKey: [QueryKeys.ALMACENES],
    queryFn: async () => {
      const response = await almacenesApi.getAll()
      if (response.error) throw new Error(response.error.message)
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 5,
  })

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: 'Mi Empresa',
      onClick: () => {
        router.push('/ui/configuracion/mi-empresa')
      }
    },
    {
      key: '2',
      label: 'Sucursales',
      children: [
        ...(almacenes || []).map(a => ({
          key: `2-${a.id}`,
          label: a.name,
          extra: almacen_id === a.id ? <FaCheck className='text-emerald-600' /> : undefined,
          onClick: () => setAlmacenId(a.id),
        })),
        { type: 'divider' as const, key: '2-divider' },
        {
          key: '2-gestionar',
          label: 'Gestionar Sucursales',
          extra: <FaPlus className='text-emerald-600' size={12} />,
          onClick: () => setOpenGestionAlmacenes(true),
        },
      ],
    },
    {
      key: '3',
      label: 'Registros',
      children: [
        {
          key: '3-1',
          label: 'Registrar Usuario',
          onClick: () => {
            router.push('/ui/configuracion/usuarios')
          },
        },
        {
          key: '3-2',
          label: 'Registrar Producto',
        },
        {
          key: '3-3',
          label: 'Registrar Cliente',
        },
        {
          key: '3-4',
          label: 'Proveedores Desactivados',
          onClick: () => {
            openModal()
          },
        },
        { type: 'divider' as const, key: '3-divider' },
        {
          key: '3-5',
          label: 'Gestionar Catálogos',
          onClick: () => {
            router.push('/ui/configuracion/registros')
          },
        },
      ],
    },
   
    {
      key: '4',
      label: 'Configuraciones',
      extra: <FaBell className='text-slate-500' />,
      onClick: () => {
        openConfiguraciones()
      },
    },
    {
      key: '5',
      label: 'Cambiar mi Contraseña',
    },
    {
      key: '6',
      label: 'Cerrar Sesión',
      className: '!text-red-500',
      extra: <FaSignOutAlt className='text-red-500' />,
      onClick: async () => {
        await logout()
        window.location.href = '/'
      },
    },
  ]

  return (
    <>
      <DropdownBase
        menu={{ items }}
        className={`ml-auto
                    mt-3 mr-3 sm:mt-4 sm:mr-4 md:mt-6 md:mr-6 lg:mt-8 lg:mr-8
                    ${className}`}
        classNameDiv='border shadow-md
                      py-1 px-3 sm:py-1 sm:px-4 md:py-1 md:px-5 lg:py-1 lg:px-6
                      rounded-md bg-white hover:bg-gray-100 transition-all
                      text-xs sm:text-sm md:text-base
                      max-w-[calc(100vw-1.5rem)] sm:max-w-none
                      truncate'
      >
        <span className='hidden sm:inline'>Hola, {user?.empresa?.razon_social || 'Usuario'}</span>
        <span className='inline sm:hidden'>Hola, {user?.empresa?.razon_social?.substring(0, 3) || 'GMR'}</span>
      </DropdownBase>
      <ModalProveedoresDesactivados />
      <ModalConfiguraciones />
      <ModalGestionarAlmacenes open={openGestionAlmacenes} setOpen={setOpenGestionAlmacenes} />
    </>
  )
}
