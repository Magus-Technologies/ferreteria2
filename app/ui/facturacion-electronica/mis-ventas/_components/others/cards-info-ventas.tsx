'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useStoreFiltrosMisVentas } from '../../_store/store-filtros-mis-ventas'
import { useMemo } from 'react'
import useGetVentas from '../../_hooks/use-get-ventas'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function CardsInfoVentas() {
  const filtros = useStoreFiltrosMisVentas(state => state.filtros)
  const { response } = useGetVentas({ where: filtros })

  // Calcular todos los totales
  const totales = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return {
        viaContado: 0,
        anulados: 0,
        viaCredito: 0,
        creditoPagado: 0,
        creditoDeuda: 0,
        totalICBPER: 0,
        totalVentas: 0,
        ventaPromedio: 0,
        comision: 0,
      }
    }

    let viaContado = 0
    let anulados = 0
    let viaCredito = 0
    let creditoPagado = 0
    let creditoDeuda = 0
    let totalICBPER = 0

    response.forEach(venta => {
      // Calcular el total de la venta desde los productos
      const totalVenta = venta.productos_por_almacen?.reduce((sum: number, productoAlmacen: any) => {
        const subtotalProducto = productoAlmacen.unidades_derivadas?.reduce((subSum: number, unidad: any) => {
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

      // El total ya incluye IGV (no multiplicar por 1.18)
      const totalConIGV = totalVenta

      // Clasificar según forma de pago y estado
      if (venta.estado === 'Anulado') {
        anulados += totalConIGV
      } else if (venta.forma_de_pago === 'Contado') {
        viaContado += totalConIGV
      } else if (venta.forma_de_pago === 'Crédito') {
        viaCredito += totalConIGV
        // Aquí podrías calcular cuánto se ha pagado y cuánto se debe
        // Por ahora asumimos que todo el crédito está pendiente
        creditoDeuda += totalConIGV
      }

      // ICBPER (si aplica)
      // totalICBPER += venta.icbper || 0
    })

    const totalVentas = viaContado + viaCredito
    const ventaPromedio = response.length > 0 ? totalVentas / response.length : 0
    const comision = totalVentas * 0.05 // Ejemplo: 5% de comisión

    return {
      viaContado,
      anulados,
      viaCredito,
      creditoPagado,
      creditoDeuda,
      totalICBPER,
      totalVentas,
      ventaPromedio,
      comision,
    }
  }, [response])

  return (
    <>
      <ConfigurableElement componentId="mis-ventas.card-via-contado" label="Card Vía Contado">
        <CardMiniInfo 
          title='Vía Contado' 
          value={totales.viaContado} 
          className='h-full'
          valueColor='text-green-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-anulados" label="Card Anulados">
        <CardMiniInfo 
          title='Anulados' 
          value={totales.anulados} 
          className='h-full'
          valueColor='text-red-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-via-credito" label="Card Vía Crédito">
        <CardMiniInfo 
          title='Vía Crédito' 
          value={totales.viaCredito} 
          className='h-full'
          valueColor='text-orange-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-credito-pagado" label="Card Crédito Pagado">
        <CardMiniInfo 
          title='Crédito (Total Paga)' 
          value={totales.creditoPagado} 
          className='h-full'
          valueColor='text-blue-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-credito-deuda" label="Card Crédito Deuda">
        <CardMiniInfo 
          title='Crédito (Deuda)' 
          value={totales.creditoDeuda} 
          className='h-full'
          valueColor='text-red-500'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-total-icbper" label="Card Total ICBPER">
        <CardMiniInfo 
          title='Total ICBPER' 
          value={totales.totalICBPER} 
          className='h-full'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-total-ventas" label="Card Total Ventas">
        <CardMiniInfo 
          title='Total Ventas' 
          value={totales.totalVentas} 
          className='h-full'
          valueColor='text-blue-700'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-venta-promedio" label="Card Venta Promedio">
        <CardMiniInfo 
          title='Venta Promedio' 
          value={totales.ventaPromedio} 
          className='h-full'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-comision" label="Card Comisión">
        <CardMiniInfo 
          title='Comisión' 
          value={totales.comision} 
          className='h-full'
          valueColor='text-purple-600'
        />
      </ConfigurableElement>
    </>
  )
}

