import { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'

export default function useItemsVentas() {
  const router = useRouter()

  const itemsVentas: MenuProps['items'] = [
    {
      key: '1',
      label: 'Crear Venta',
      onClick: () =>
        router.push('/ui/facturacion-electronica/mis-ventas/crear-venta'),
    },
    {
      key: '2',
      label: 'Crear Cotizacion',
      onClick: () =>
        router.push('/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion'),
    },
    {
      key: '3',
      label: 'Prestar / Pedir',
      onClick:()=> {
        router.push('/ui/facturacion-electronica/mis-prestamos/crear-prestamo')
      }
    },
    {
      key: '4',
      label: 'Crear Guía',
    },
    {
      key: '5',
      label: 'Crear Nota de Crédito',
    },
    {
      key: '6',
      label: 'Crear Nota de Débito',
    },
    {
      key: '7',
      label: 'Envíos a Sunat',
    },
  ]

  return {
    itemsVentas,
  }
}
