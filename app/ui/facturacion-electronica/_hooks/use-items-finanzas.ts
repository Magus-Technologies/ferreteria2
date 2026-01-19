import { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'

export default function useItemsFinanzas({
  setOpenAperturaCaja,
  setOpenCrearIngreso,
  setOpenCrearGasto,
}: {
  setOpenAperturaCaja: (open: boolean) => void
  setOpenCrearIngreso: (open: boolean) => void
  setOpenCrearGasto: (open: boolean) => void
}) {
  const router = useRouter()

  const itemsFinanzas: MenuProps['items'] = [
    {
      key: '1',
      label: 'Aperturar Caja',
      onClick: () => setOpenAperturaCaja(true),
    },
    {
      key: '2',
      label: 'Cerrar Caja',
      onClick: () => router.push('/ui/facturacion-electronica/cierre-caja'),
    },
    {
      key: '3',
      label: 'Crear Ingreso',
      onClick: () => setOpenCrearIngreso(true),
    },
    {
      key: '4',
      label: 'Crear Gasto',
      onClick: () => setOpenCrearGasto(true),
    },
    {
      type: 'divider',
    },
    {
      key: '5',
      label: 'Gestión de Cajas',
      onClick: () => router.push('/ui/facturacion-electronica/gestion-cajas'),
    },
  ]

  return {
    itemsFinanzas,
  }
}
