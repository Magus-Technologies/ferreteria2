'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { cotizacionesApi, type Cotizacion } from '~/lib/api/cotizaciones'
import { useStoreAlmacen } from '~/store/store-almacen'

export default function CardsInfoCotizaciones() {
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const { data: response } = useQuery({
    queryKey: [QueryKeys.COTIZACIONES, almacen_id ?? 0],
    queryFn: async () => {
      const result = await cotizacionesApi.getAll({ 
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
        pendientes: 0,
        confirmadas: 0,
        vendidas: 0,
        canceladas: 0,
        totalCotizaciones: 0,
        cotizacionPromedio: 0,
        stockReservado: 0,
      }
    }

    let pendientes = 0
    let confirmadas = 0
    let vendidas = 0
    let canceladas = 0
    let stockReservado = 0

    response.forEach((cotizacion: Cotizacion) => {
      // Calcular el total de la cotización desde los productos
      const totalCotizacion = cotizacion.productos_por_almacen?.reduce((sum, productoAlmacen) => {
        const subtotalProducto = productoAlmacen.unidades_derivadas?.reduce((subSum, unidad) => {
          const cantidad = Number(unidad.cantidad);
          const precio = Number(unidad.precio);
          const recargo = Number(unidad.recargo || 0);
          const descuento = Number(unidad.descuento || 0);
          
          // Calcular total de la línea (SIN multiplicar por factor)
          const subtotalLinea = precio * cantidad;
          const subtotalConRecargo = subtotalLinea + recargo;
          
          // Aplicar descuento
          let montoLinea = subtotalConRecargo;
          if (unidad.descuento_tipo === '%') {
            montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100);
          } else {
            montoLinea = subtotalConRecargo - descuento;
          }
          
          return subSum + montoLinea;
        }, 0) || 0
        return sum + subtotalProducto
      }, 0) || 0

      // Clasificar según estado
      switch (cotizacion.estado_cotizacion) {
        case 'pe': // Pendiente
          pendientes += totalCotizacion
          break
        case 'co': // Confirmado
          confirmadas += totalCotizacion
          break
        case 've': // Vendido
          vendidas += totalCotizacion
          break
        case 'ca': // Cancelado
          canceladas += totalCotizacion
          break
      }

      // Contar cotizaciones con stock reservado
      if (cotizacion.reservar_stock) {
        stockReservado += totalCotizacion
      }
    })

    const totalCotizaciones = pendientes + confirmadas + vendidas + canceladas
    const cotizacionPromedio = response.length > 0 ? totalCotizaciones / response.length : 0

    return {
      pendientes,
      confirmadas,
      vendidas,
      canceladas,
      totalCotizaciones,
      cotizacionPromedio,
      stockReservado,
    }
  }, [response])

  return (
    <>
      <CardMiniInfo 
        title='Pendientes' 
        value={totales.pendientes} 
        className='h-full'
        valueColor='text-orange-600'
      />
      <CardMiniInfo 
        title='Confirmadas' 
        value={totales.confirmadas} 
        className='h-full'
        valueColor='text-blue-600'
      />
      <CardMiniInfo 
        title='Vendidas' 
        value={totales.vendidas} 
        className='h-full'
        valueColor='text-green-600'
      />
      <CardMiniInfo 
        title='Canceladas' 
        value={totales.canceladas} 
        className='h-full'
        valueColor='text-red-600'
      />
      <CardMiniInfo 
        title='Total Cotizaciones' 
        value={totales.totalCotizaciones} 
        className='h-full'
        valueColor='text-blue-700'
      />
      <CardMiniInfo 
        title='Cotización Promedio' 
        value={totales.cotizacionPromedio} 
        className='h-full'
      />
      <CardMiniInfo 
        title='Stock Reservado' 
        value={totales.stockReservado} 
        className='h-full'
        valueColor='text-purple-600'
      />
    </>
  )
}
