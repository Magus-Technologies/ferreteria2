'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useStoreFiltrosMisVentas } from '../../_store/store-filtros-mis-ventas'
import { useMemo } from 'react'
import useGetVentas from '../../_hooks/use-get-ventas'
import { EstadoDeVenta, FormaDePago } from '~/lib/api/venta'
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
    let comision = 0

    response.forEach((venta: any) => {
      // Calcular el total de la venta y comisión desde los productos
      let totalVenta = 0

      venta.productos_por_almacen?.forEach((productoAlmacen: any) => {
        productoAlmacen.unidades_derivadas?.forEach((unidad: any) => {
          const cantidad = Number(unidad.cantidad);
          const precio = Number(unidad.precio);
          const recargo = Number(unidad.recargo || 0);
          const descuento = Number(unidad.descuento || 0);
          
          // Calcular total de la línea
          const subtotalLinea = precio * cantidad;
          const subtotalConRecargo = subtotalLinea + recargo;
          
          // Aplicar descuento
          let montoLinea = subtotalConRecargo;
          if (unidad.descuento_tipo === '%') {
            montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100);
          } else {
            montoLinea = subtotalConRecargo - descuento;
          }
          
          totalVenta += montoLinea;

          // Comisión por unidad (si tiene)
          const comisionUnidad = Number(unidad.comision || 0);
          if (comisionUnidad > 0) {
            comision += comisionUnidad * cantidad;
          }
        });
      });

      // Clasificar según forma de pago y estado
      if (venta.estado_de_venta === EstadoDeVenta.ANULADO) {
        anulados += totalVenta
      } else if (venta.forma_de_pago === FormaDePago.CONTADO) {
        viaContado += totalVenta
      } else if (venta.forma_de_pago === FormaDePago.CREDITO) {
        viaCredito += totalVenta
        // Calcular cuánto se ha pagado y cuánto se debe
        const pagado = Number(venta.total_cobrado || 0)
        creditoPagado += pagado
        creditoDeuda += totalVenta - pagado
      }

      // ICBPER (si aplica)
      // totalICBPER += venta.icbper || 0
    })

    const totalVentas = viaContado + viaCredito
    const ventaPromedio = response.length > 0 ? totalVentas / response.length : 0

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
          className='w-full'
          valueColor='text-green-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-anulados" label="Card Anulados">
        <CardMiniInfo 
          title='Anulados' 
          value={totales.anulados} 
          className='w-full'
          valueColor='text-red-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-via-credito" label="Card Vía Crédito">
        <CardMiniInfo 
          title='Vía Crédito' 
          value={totales.viaCredito} 
          className='w-full'
          valueColor='text-orange-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-credito-pagado" label="Card Crédito Pagado">
        <CardMiniInfo 
          title='Crédito (Total Paga)' 
          value={totales.creditoPagado} 
          className='w-full'
          valueColor='text-blue-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-credito-deuda" label="Card Crédito Deuda">
        <CardMiniInfo 
          title='Crédito (Deuda)' 
          value={totales.creditoDeuda} 
          className='w-full'
          valueColor='text-red-500'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-total-icbper" label="Card Total ICBPER">
        <CardMiniInfo 
          title='Total ICBPER' 
          value={totales.totalICBPER} 
          className='w-full'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-total-ventas" label="Card Total Ventas">
        <CardMiniInfo 
          title='Total Ventas' 
          value={totales.totalVentas} 
          className='w-full'
          valueColor='text-blue-700'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-venta-promedio" label="Card Venta Promedio">
        <CardMiniInfo 
          title='Venta Promedio' 
          value={totales.ventaPromedio} 
          className='w-full'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="mis-ventas.card-comision" label="Card Comisión">
        <CardMiniInfo 
          title='Comisión' 
          value={totales.comision} 
          className='w-full'
          valueColor='text-purple-600'
        />
      </ConfigurableElement>
    </>
  )
}

