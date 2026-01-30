'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { prestamoApi, type Prestamo, EstadoPrestamo, TipoOperacion } from '~/lib/api/prestamo'
import { useStoreAlmacen } from '~/store/store-almacen'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function CardsInfoPrestamos() {
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const { data: response } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, almacen_id ?? 0],
    queryFn: async () => {
      const result = await prestamoApi.getAll({
        almacen_id: almacen_id ?? undefined
      })
      return result.data?.data || []
    },
    enabled: !!almacen_id,
  })

  // Calcular todos los totales
  const totales = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return {
        totalPrestamos: 0,
        pendientes: 0,
        devueltoParcial: 0,
        devueltoTotal: 0,
        vencidos: 0,
        prestados: 0,
        emprestados: 0,
      }
    }

    let pendientes = 0
    let devueltoParcial = 0
    let devueltoTotal = 0
    let vencidos = 0
    let prestados = 0
    let emprestados = 0

    response.forEach((prestamo: Prestamo) => {
      // Contar por estado
      switch (prestamo.estado_prestamo) {
        case EstadoPrestamo.PENDIENTE:
          pendientes++
          break
        case EstadoPrestamo.PAGADO_PARCIAL:
          devueltoParcial++
          break
        case EstadoPrestamo.PAGADO_TOTAL:
          devueltoTotal++
          break
        case EstadoPrestamo.VENCIDO:
          vencidos++
          break
      }

      // Contar por tipo de operación
      switch (prestamo.tipo_operacion) {
        case TipoOperacion.PRESTAR:
          prestados++
          break
        case TipoOperacion.PEDIR_PRESTADO:
          emprestados++
          break
      }
    })

    const totalPrestamos = response.length

    return {
      totalPrestamos,
      pendientes,
      devueltoParcial,
      devueltoTotal,
      vencidos,
      prestados,
      emprestados,
    }
  }, [response])

  return (
    <>
      <ConfigurableElement componentId="mis-prestamos.card-total" label="Card Total Préstamos">
        <CardMiniInfo 
          title='Total Préstamos' 
          value={totales.totalPrestamos} 
          className='h-full'
          valueColor='text-blue-700'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-prestamos.card-pendientes" label="Card Pendientes">
        <CardMiniInfo 
          title='Pendientes' 
          value={totales.pendientes} 
          className='h-full'
          valueColor='text-orange-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-prestamos.card-devuelto-parcial" label="Card Devuelto Parcial">
        <CardMiniInfo 
          title='Devuelto Parcial' 
          value={totales.devueltoParcial} 
          className='h-full'
          valueColor='text-yellow-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-prestamos.card-devuelto-total" label="Card Devuelto Total">
        <CardMiniInfo 
          title='Devuelto Total' 
          value={totales.devueltoTotal} 
          className='h-full'
          valueColor='text-green-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-prestamos.card-vencidos" label="Card Vencidos">
        <CardMiniInfo 
          title='Vencidos' 
          value={totales.vencidos} 
          className='h-full'
          valueColor='text-red-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-prestamos.card-prestados" label="Card Prestados">
        <CardMiniInfo 
          title='Prestados' 
          value={totales.prestados} 
          className='h-full'
          valueColor='text-blue-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-prestamos.card-emprestados" label="Card Emprestados">
        <CardMiniInfo 
          title='Emprestados' 
          value={totales.emprestados} 
          className='h-full'
          valueColor='text-purple-600'
        />
      </ConfigurableElement>
    </>
  )
}
