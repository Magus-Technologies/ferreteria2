import { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

type MenuItem = NonNullable<MenuProps['items']>[number]

export default function useItemsFinanzas({
  setOpenAperturaCaja,
  setOpenCrearIngreso,
  setOpenCrearGasto,
  setOpenMoverDinero,
  setOpenPedirPrestamo,
}: {
  setOpenAperturaCaja: (open: boolean) => void
  setOpenCrearIngreso: (open: boolean) => void
  setOpenCrearGasto: (open: boolean) => void
  setOpenMoverDinero: (open: boolean) => void
  setOpenPedirPrestamo: (open: boolean) => void
}) {
  const router = useRouter()
  const canAperturarCaja = usePermission(permissions.CAJA_CREATE)
  const canCerrarCaja = usePermission(permissions.CAJA_UPDATE)

  const allItems: Array<MenuItem | null> = [
    canAperturarCaja ? {
      key: '1',
      label: 'Aperturar Caja',
      onClick: () => setOpenAperturaCaja(true),
    } : null,
    canCerrarCaja ? {
      key: '2',
      label: 'Cerrar Caja',
      onClick: () => router.push('/ui/facturacion-electronica/cierre-caja'),
    } : null,
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
      key: '5',
      label: 'Mover Dinero entre Sub-Cajas',
      onClick: () => setOpenMoverDinero(true),
    },
    {
      key: '6',
      label: 'Pedir Préstamo',
      onClick: () => setOpenPedirPrestamo(true),
    },
    {
      type: 'divider',
    },
    {
      key: '7',
      label: 'Gestión de Cajas',
      onClick: () => router.push('/ui/facturacion-electronica/gestion-cajas'),
    },
    {
      key: '8',
      label: 'Métodos de Pago',
      onClick: () => router.push('/ui/facturacion-electronica/metodos-pago'),
    },
  ]

  // Filtrar items nulos (permisos denegados)
  const itemsFinanzas = allItems.filter((item): item is MenuItem => item !== null)

  return {
    itemsFinanzas,
  }
}
