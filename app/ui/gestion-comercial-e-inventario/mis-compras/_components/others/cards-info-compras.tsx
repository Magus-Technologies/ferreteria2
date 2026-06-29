'use client'

import CardMiniInfo from '../cards/card-mini-info'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { compraApi, type Compra, type CompraFilters } from '~/lib/api/compra'
import { EstadoDeCompra } from '~/types'
import type { CompraWhereInput } from '~/types'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

function calcularTotalCompra(compra: Compra) {
  const total = (compra.productos_por_almacen || []).reduce((acc, item) => {
    const costo = Number(item.costo ?? 0)
    for (const u of item.unidades_derivadas ?? []) {
      const cantidad = Number(u.cantidad ?? 0)
      const factor = Number(u.factor ?? 0)
      const flete = Number(u.flete ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
      acc += montoLinea
    }
    return acc
  }, 0)
  return total + Number(compra.percepcion ?? 0)
}

function convertirFiltros(filtros: CompraWhereInput | undefined): CompraFilters | undefined {
  if (!filtros) return undefined

  const estadoMap: Record<string, string> = {
    Creado: 'cr',
    Creados: 'cr',
    EnEspera: 'ee',
    Anulado: 'an',
    Procesado: 'pr',
    cr: 'cr',
    pr: 'pr',
    ee: 'ee',
    an: 'an',
  }

  const formaPagoMap: Record<string, string> = {
    Contado: 'co',
    Credito: 'cr',
  }

  let estadoDeCompra: string | { in: string[] } | undefined
  if (filtros.estado_de_compra) {
    const estadoFilter = filtros.estado_de_compra as any
    if (estadoFilter.equals) {
      estadoDeCompra = estadoMap[estadoFilter.equals] || estadoFilter.equals
    } else if (estadoFilter.in && Array.isArray(estadoFilter.in) && estadoFilter.in.length > 0) {
      estadoDeCompra = {
        in: estadoFilter.in.map((e: string) => estadoMap[e] || e),
      }
    } else if (typeof estadoFilter === 'string') {
      estadoDeCompra = estadoMap[estadoFilter] || estadoFilter
    }
  }

  let formaDePago: string | undefined
  if (filtros.forma_de_pago) {
    const formaPago = filtros.forma_de_pago as string
    formaDePago = formaPagoMap[formaPago] || formaPago
  }

  let tipoDocumento: string | undefined
  if (filtros.tipo_documento) {
    const tipoDoc = filtros.tipo_documento as string
    const tipoDocumentoMap: Record<string, string> = {
      Factura: '01',
      Boleta: '03',
      NotaDeVenta: 'nv',
      Ingreso: 'in',
      Salida: 'sa',
      RecepcionAlmacen: 'rc',
    }
    tipoDocumento = tipoDocumentoMap[tipoDoc] || tipoDoc
  }

  let ordenCompraId: { not: null } | undefined
  if (filtros.orden_compra_id) {
    const ordenFilter = filtros.orden_compra_id as any
    if (ordenFilter.not === null) {
      ordenCompraId = { not: null }
    }
  }

  const fechaFilter = filtros.fecha as any
  const desde = fechaFilter?.gte ? new Date(fechaFilter.gte).toISOString().split('T')[0] : undefined
  const hasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toISOString().split('T')[0] : undefined

  return {
    almacen_id: filtros.almacen_id as number | undefined,
    estado_de_compra: estadoDeCompra,
    estado_de_cuenta: (filtros as any)?.estado_de_cuenta as string | undefined,
    orden_compra_id: ordenCompraId,
    proveedor_id: filtros.proveedor_id as number | undefined,
    forma_de_pago: formaDePago,
    tipo_documento: tipoDocumento,
    user_id: filtros.user_id as string | undefined,
    desde,
    hasta,
    search: (filtros as any).search as string | undefined,
    per_page: -1,
  }
}

export default function CardsInfoCompras() {
  const filtros = useStoreFiltrosMisCompras(state => state.filtros)

  const apiFilters = useMemo(() => convertirFiltros(filtros), [filtros])

  const { data: response } = useQuery({
    queryKey: [QueryKeys.COMPRAS, 'cards-info', apiFilters],
    queryFn: async () => {
      const result = await compraApi.getAll(apiFilters as CompraFilters)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!
    },
    enabled: !!filtros,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const compras = response?.data ?? []

  const totales = useMemo(() => {
    let viaContado = 0
    let anulados = 0
    let viaCredito = 0
    let creditoPagado = 0
    let creditoDeuda = 0
    let recepcionadas = 0
    let totalPercepcion = 0

    compras.forEach(compra => {
      const totalCompra = calcularTotalCompra(compra)
      const totalPagado = Number(compra.total_pagado || 0)
      const resta = totalCompra - totalPagado
      const percepcion = Number(compra.percepcion ?? 0)

      totalPercepcion += percepcion

      if (compra.estado_de_compra === EstadoDeCompra.Anulado) {
        anulados += totalCompra
      } else if (compra.forma_de_pago === 'co') {
        viaContado += totalCompra
      } else if (compra.forma_de_pago === 'cr') {
        viaCredito += totalCompra
        if (resta <= 0.01) {
          creditoPagado += totalCompra
        } else {
          creditoDeuda += totalCompra
        }
      }

      if (compra.estado_de_compra === EstadoDeCompra.Procesado) {
        recepcionadas += totalCompra
      }
    })

    const totalCompras = viaContado + viaCredito
    const compraPromedio = compras.length > 0 ? totalCompras / compras.length : 0

    return {
      viaContado,
      anulados,
      viaCredito,
      creditoPagado,
      creditoDeuda,
      recepcionadas,
      totalCompras,
      compraPromedio,
      totalPercepcion,
    }
  }, [compras])

  return (
    <>
      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-via-contado" label="Card Vía Contado">
        <CardMiniInfo
          title='Vía Contado'
          value={totales.viaContado}
          className='w-full'
          valueColor='text-orange-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-anulados" label="Card Anulados">
        <CardMiniInfo
          title='Anulados'
          value={totales.anulados}
          className='w-full'
          valueColor='text-red-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-via-credito" label="Card Vía Crédito">
        <CardMiniInfo
          title='Vía Crédito'
          value={totales.viaCredito}
          className='w-full'
          valueColor='text-red-500'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-credito-pagado" label="Card Crédito Pagado">
        <CardMiniInfo
          title='Crédito (Total Pagado)'
          value={totales.creditoPagado}
          className='w-full'
          valueColor='text-green-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-credito-deuda" label="Card Crédito Deuda">
        <CardMiniInfo
          title='Crédito (Deuda)'
          value={totales.creditoDeuda}
          className='w-full'
          valueColor='text-red-500'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-recepcionadas" label="Card Recepcionadas">
        <CardMiniInfo
          title='Recepcionadas'
          value={totales.recepcionadas}
          className='w-full'
          valueColor='text-cyan-600'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-total-compras" label="Card Total Compras">
        <CardMiniInfo
          title='Total Compras'
          value={totales.totalCompras}
          className='w-full'
          valueColor='text-blue-700'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-compra-promedio" label="Card Compra Promedio">
        <CardMiniInfo
          title='Compra Promedio'
          value={totales.compraPromedio}
          className='w-full'
        />
      </ConfigurableElement>

      <ConfigurableElement componentId="gestion-comercial.mis-compras.card-percepcion" label="Card Percepción">
        <CardMiniInfo
          title='Percepción'
          value={totales.totalPercepcion}
          className='w-full'
          valueColor='text-purple-600'
        />
      </ConfigurableElement>
    </>
  )
}
