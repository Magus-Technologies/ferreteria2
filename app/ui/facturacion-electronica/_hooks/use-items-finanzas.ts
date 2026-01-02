import { MenuProps, message } from 'antd'
import { cajaApi } from '~/lib/api/caja'

export default function useItemsFinanzas({
  setOpenAperturaCaja,
}: {
  setOpenAperturaCaja: (open: boolean) => void
}) {
  async function handleAperturarCaja() {
    try {
      const response = await cajaApi.consultaApertura()

      if (response.error) {
        message.error(response.error.message || 'Error al consultar apertura de caja')
        return
      }

      // Si no hay error, significa que no hay caja abierta
      setOpenAperturaCaja(true)
    } catch (error) {
      console.error('Error al consultar apertura:', error)
      message.error('Error inesperado al consultar apertura de caja')
    }
  }

  const itemsFinanzas: MenuProps['items'] = [
    {
      key: '1',
      label: 'Aperturar Caja',
      onClick: handleAperturarCaja,
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
