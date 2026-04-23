'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getEcho, destroyEcho } from '~/lib/echo'
import { getAuthToken } from '~/lib/api'
import { emitModelChanged } from '~/lib/realtime-bus'

/**
 * Mapeo de módulo del backend → query keys del frontend a invalidar.
 */
const MODULE_TO_QUERY_KEYS: Record<string, string[]> = {
  ventas: [
    QueryKeys.VENTAS,
    QueryKeys.VENTAS_EN_ESPERA,
    QueryKeys.VENTAS_POR_COBRAR,
    QueryKeys.VENTAS_POR_COBRAR_STATS,
    QueryKeys.VENTAS_POR_COBRAR_TOTAL,
    QueryKeys.COBROS_VENTA,
    QueryKeys.VENTA_HISTORIAL,
    QueryKeys.VENTAS_HISTORIAL_GENERAL,
    QueryKeys.GANANCIAS,
    QueryKeys.GANANCIAS_RESUMEN,
    QueryKeys.KARDEX,
    QueryKeys.ENTREGAS_PRODUCTOS,
    'productos-infinite',
    'vencimientos-proximos',
  ],
  compras: [
    QueryKeys.COMPRAS,
    QueryKeys.COMPRAS_ANULADAS,
    QueryKeys.COMPRAS_EN_ESPERA,
    QueryKeys.COMPRAS_POR_PAGAR,
    QueryKeys.COMPRAS_POR_PAGAR_STATS,
    QueryKeys.COMPRAS_POR_PAGAR_TOTAL,
    QueryKeys.COMPRAS_RESUMEN_MENSUAL,
    QueryKeys.COMPRAS_REPORTE,
    QueryKeys.COMPRAS_RESUMEN,
    QueryKeys.KARDEX,
    'productos-infinite',
    'vencimientos-proximos',
  ],
  productos: [
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    QueryKeys.KARDEX,
    QueryKeys.KARDEX_INVENTARIO,
    'productos-infinite',
  ],
  cotizaciones: [QueryKeys.COTIZACIONES],
  clientes: [
    QueryKeys.CLIENTES,
    QueryKeys.CLIENTES_SEARCH,
    QueryKeys.CLIENTES_TOP,
    QueryKeys.CLIENTES_RESUMEN,
    QueryKeys.CLIENTES_POR_COBRAR,
    QueryKeys.CLIENTES_LISTADO,
    QueryKeys.CLIENTES_FRECUENTES,
    QueryKeys.CLIENTES_RECIENTES,
    QueryKeys.DIRECCIONES_CLIENTE,
    'cumpleanos-proximos',
  ],
  proveedores: [QueryKeys.PROVEEDORES, QueryKeys.PROVEEDORES_SEARCH],
  'ingresos-salidas': [
    QueryKeys.INGRESOS_SALIDAS,
    QueryKeys.KARDEX,
    QueryKeys.KARDEX_INVENTARIO,
    'productos-infinite',
  ],
  'transferencias-stock': [
    QueryKeys.TRANSFERENCIAS_STOCK,
    QueryKeys.KARDEX,
    'productos-infinite',
  ],
  'recepciones-almacen': [
    QueryKeys.RECEPCIONES_ALMACEN,
    QueryKeys.KARDEX,
    'productos-infinite',
  ],
  'entregas-productos': [QueryKeys.ENTREGAS_PRODUCTOS],
  prestamos: [QueryKeys.PRESTAMOS, QueryKeys.PRESTAMOS_PENDIENTES],
  cajas: [
    QueryKeys.CAJAS_PRINCIPALES,
    QueryKeys.SUB_CAJAS,
    QueryKeys.CAJA_ACTIVA,
    QueryKeys.APERTURA_CAJA,
    QueryKeys.HISTORIAL_APERTURAS,
    QueryKeys.HISTORIAL_APERTURAS_TODAS,
    QueryKeys.HISTORIAL_CIERRES,
    QueryKeys.MOVIMIENTOS_INTERNOS,
  ],
  gastos: [QueryKeys.MIS_GASTOS, QueryKeys.EGRESOS_DINERO],
  ingresos: [QueryKeys.GANANCIAS, QueryKeys.GANANCIAS_RESUMEN],
  'ordenes-compra': [QueryKeys.ORDENES_COMPRA, QueryKeys.SOLICITUD_ORDEN_COMPRA],
  almacenes: [QueryKeys.ALMACENES],
  categorias: [QueryKeys.CATEGORIAS],
  marcas: [QueryKeys.MARCAS],
  ubicaciones: [QueryKeys.UBICACIONES],
  'unidades-medida': [QueryKeys.UNIDADES_MEDIDA],
  'unidades-derivadas': [QueryKeys.UNIDADES_DERIVADAS],
  'tipos-ingreso-salida': [QueryKeys.TIPOS_INGRESO_SALIDA],
  'tipos-servicio': [QueryKeys.TIPOS_SERVICIO],
  vehiculos: [QueryKeys.VEHICULOS],
  usuarios: [QueryKeys.USUARIOS, QueryKeys.VENDEDORES_DISPONIBLES, 'cumpleanos-proximos'],
  empresas: [QueryKeys.EMPRESAS],
  'guias-remision': [QueryKeys.GUIAS_REMISION, QueryKeys.MOTIVOS_TRASLADO],
  'despliegues-de-pago': [QueryKeys.DESPLIEGUE_DE_PAGO, QueryKeys.METODO_DE_PAGO],
  'series-documentos': [],
  choferes: [QueryKeys.CHOFERES],
  'facturacion-electronica': [QueryKeys.VENTAS, QueryKeys.CONFIGURACION, 'sunat-alertas-pendientes'],
  autorizaciones: ['autorizaciones'],
  'prestamos-vendedores': ['solicitudes-efectivo-pendientes'],
  'requerimientos-internos': ['requerimientos-internos-pendientes'],
}

interface ModelChangedEvent {
  module: string
  action: string
  record_id: string | null
  user_id: string | null
  timestamp: string
}

/**
 * Hook que escucha eventos de WebSocket via Laravel Reverb
 * e invalida automáticamente las queries de React Query correspondientes.
 */
export function useRealtime() {
  const queryClient = useQueryClient()
  const connectedRef = useRef(false)
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function tryConnect() {
      const token = getAuthToken()
      if (!token) return false

      const echo = getEcho()
      if (!echo) return false

      if (connectedRef.current) return true

      connectedRef.current = true
      echo
        .channel('model-changes')
        .listen('.model.changed', (event: ModelChangedEvent) => {
          // Re-emitir al bus interno para que otros componentes reaccionen
          // sin abrir un segundo listener del canal
          emitModelChanged(event)

          const queryKeys = MODULE_TO_QUERY_KEYS[event.module]
          if (!queryKeys || queryKeys.length === 0) return

          for (const key of queryKeys) {
            queryClient.invalidateQueries({ queryKey: [key] })
          }
        })

      return true
    }

    // Intentar conectar inmediatamente
    if (tryConnect()) return

    // Si no hay token aún, reintentar cada 2 segundos hasta que se logee
    retryRef.current = setInterval(() => {
      if (tryConnect() && retryRef.current) {
        clearInterval(retryRef.current)
        retryRef.current = null
      }
    }, 2000)

    return () => {
      if (retryRef.current) {
        clearInterval(retryRef.current)
        retryRef.current = null
      }
      if (connectedRef.current) {
        const echo = getEcho()
        echo?.leave('model-changes')
        connectedRef.current = false
        destroyEcho()
      }
    }
  }, [queryClient])
}
