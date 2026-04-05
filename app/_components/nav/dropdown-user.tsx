'use client'

import { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'
import { BiSolidReport } from 'react-icons/bi'
import { FaBell, FaCalculator, FaCheck, FaPlus, FaSignOutAlt, FaWarehouse } from 'react-icons/fa'
import { IoDocumentText, IoSettingsSharp } from 'react-icons/io5'
import { MdOutlineMenuOpen } from 'react-icons/md'
import { PiWarehouseFill } from 'react-icons/pi'
import { useAuth } from '~/lib/auth-context'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { useModalConfiguraciones } from '~/app/_stores/store-modal-configuraciones'
import ModalConfiguraciones from '~/app/_components/modals/modal-configuraciones'
import ModalGestionarAlmacenes from '~/app/ui/_components/modals/modal-gestionar-almacenes'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'

export default function DropdownUser() {
  const router = useRouter()
  const { logout, user } = useAuth()
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
      label: 'Menú Principal',
      extra: <MdOutlineMenuOpen className='text-cyan-500' size={20} />,
      onClick: () => router.push('/ui'),
    },
    {
      type: 'divider',
    },
    {
      key: 'sucursales',
      label: 'Sucursales',
      extra: <PiWarehouseFill className='text-emerald-600' size={16} />,
      children: [
        ...(almacenes || []).map((a: any) => ({
          key: `suc-${a.id}`,
          label: a.name,
          extra: almacen_id === a.id ? <FaCheck className='text-emerald-600' /> : undefined,
          onClick: () => setAlmacenId(a.id),
        })),
        { type: 'divider' as const, key: 'suc-divider' },
        {
          key: 'suc-gestionar',
          label: 'Gestionar Sucursales',
          extra: <FaPlus className='text-emerald-600' size={12} />,
          onClick: () => setOpenGestionAlmacenes(true),
        },
      ],
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
      label: 'Configuraciones',
      extra: <IoSettingsSharp className='text-slate-500' size={15} />,
      onClick: () => openConfiguraciones(),
    },
    {
      key: '3',
      label: 'Cambiar Contraseña',
    },
    {
      type: 'divider',
    },
    {
      key: '4',
      label: 'Cerrar Sesión',
      className: '!text-red-500',
      extra: <FaSignOutAlt className='text-red-500' />,
      onClick: async () => {
        await logout()
        router.push('/')
      },
    },
  ]

  return (
    <>
      <DropdownBase menu={{ items }}>
        <span className='font-bold max-w-[120px] sm:max-w-[150px] md:max-w-[180px] truncate inline-block align-middle'>Hola, {user?.name || 'Usuario'}</span>
      </DropdownBase>
      <ModalConfiguraciones />
      <ModalGestionarAlmacenes open={openGestionAlmacenes} setOpen={setOpenGestionAlmacenes} />
    </>
  )
}
