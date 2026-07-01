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
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    'productos-search',
    'productos-modal-search', // queryKey real del modal "Buscar Producto" (ventas/cotizaciones/guías)
    'productos-infinite',
    'productos-listado-completo',
    'vencimientos-proximos',
    // Una venta puede aplicar vales y descontar su stock → refrescar la lista de vales.
    'vales-compra',
    'vale-compra',
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
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
    'vencimientos-proximos',
  ],
  productos: [
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    QueryKeys.KARDEX,
    QueryKeys.KARDEX_INVENTARIO,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
  ],
  cotizaciones: [
    QueryKeys.COTIZACIONES,
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    QueryKeys.KARDEX,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
    'vencimientos-proximos',
  ],
  // Vales de compra (promociones). 'vales-compra' = listas (valesCompraKeys.all),
  // 'vale-compra' = detalle usado por editar-vale y el modal PDF.
  // La pantalla crear-venta NO usa React Query para los vales (Zustand + POST manual),
  // por eso input-codigo-vale.tsx se suscribe aparte vía subscribeModelChanged.
  'vales-compra': ['vales-compra', 'vale-compra'],
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
  'cliente-calificaciones': ['ultima-calificacion', 'cliente-calificaciones', 'cliente-calificaciones-resumen'],
  'ingresos-salidas': [
    QueryKeys.INGRESOS_SALIDAS,
    QueryKeys.KARDEX,
    QueryKeys.KARDEX_INVENTARIO,
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
  ],
  'transferencias-stock': [
    QueryKeys.TRANSFERENCIAS_STOCK,
    QueryKeys.KARDEX,
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
  ],
  'recepciones-almacen': [
    QueryKeys.RECEPCIONES_ALMACEN,
    QueryKeys.KARDEX,
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
  ],
  // Las entregas modifican stock (cuando estado=ENTREGADO) → invalidar productos.
  // También cambian la cobertura/estado de la venta → invalidar VENTAS para que
  // mis-ventas refresque la columna de estado (sin esto el staleTime sirve data vieja).
  'entregas-productos': [
    QueryKeys.ENTREGAS_PRODUCTOS,
    QueryKeys.VENTAS,
    QueryKeys.VENTA_HISTORIAL,
    QueryKeys.VENTAS_HISTORIAL_GENERAL,
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    QueryKeys.KARDEX,
    QueryKeys.KARDEX_INVENTARIO,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
  ],
  prestamos: [
    QueryKeys.PRESTAMOS,
    QueryKeys.PRESTAMOS_PENDIENTES,
    QueryKeys.PRODUCTOS,
    QueryKeys.PRODUCTOS_BY_ALMACEN,
    QueryKeys.PRODUCTOS_SEARCH,
    QueryKeys.PRODUCTOS_TABLE_SEARCH,
    QueryKeys.KARDEX,
    QueryKeys.KARDEX_INVENTARIO,
    'productos-search',
    'productos-modal-search',
    'productos-infinite',
    'productos-listado-completo',
    'vencimientos-proximos',
  ],
  cajas: [
    QueryKeys.CAJAS_PRINCIPALES,
    QueryKeys.SUB_CAJAS,
    QueryKeys.CAJA_ACTIVA,
    QueryKeys.APERTURA_CAJA,
    QueryKeys.HISTORIAL_APERTURAS,
    QueryKeys.HISTORIAL_APERTURAS_TODAS,
    QueryKeys.HISTORIAL_CIERRES,
    QueryKeys.MOVIMIENTOS_INTERNOS,
    // Query propia del "Resumen detalle" del cierre (traslados a bóveda).
    'traslados-boveda',
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
  'configuracion-entrega': ['configuracion-entrega'],
  'prestamos-vendedores': ['solicitudes-efectivo-pendientes'],
  'requerimientos-internos': [
    QueryKeys.ORDENES_DE_SERVICIO,
    QueryKeys.SOLICITUD_ORDEN_COMPRA,
    'requerimientos-internos',
    'requerimientos-internos-pendientes',
    QueryKeys.VEHICULOS,
  ],
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
