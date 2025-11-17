import { MenuProps } from 'antd'
import { consultaAperturaCaja } from '~/app/_actions/caja'
import { useServerMutation } from '~/hooks/use-server-mutation'

export default function useItemsFinanzas({
  setOpenAperturaCaja,
}: {
  setOpenAperturaCaja: (open: boolean) => void
}) {
  const { execute } = useServerMutation({
    action: consultaAperturaCaja,
    onSuccess: () => setOpenAperturaCaja(true),
  })

  const itemsFinanzas: MenuProps['items'] = [
    {
      key: '1',
      label: 'Aperturar Caja',
      onClick: () => execute({}),
    },
    {
      key: '2',
      label: 'Cerrar Caja',
    },
    {
      key: '3',
      label: 'Crear Ingreso',
    },
    {
      key: '4',
      label: 'Crear Gasto',
    },
  ]

  return {
    itemsFinanzas,
  }
}
