'use client'

import { useState, useMemo } from 'react'
import { FaPlus, FaHistory } from 'react-icons/fa'
import { Spin } from 'antd'
import ButtonBase from '~/components/buttons/button-base'
import { useStoreVentaSeleccionada } from '../tables/table-mis-ventas'
import ModalResumenEntregaVenta, { type TipoEntregaCodigo, type CantidadOverride } from '../modals/modal-resumen-entrega-venta'
import ModalNuevaEntregaVenta from '~/app/ui/facturacion-electronica/mis-entregas/_components/modals/modal-nueva-entrega-venta'
import useEntregasDeVenta from '~/app/ui/facturacion-electronica/mis-entregas/_hooks/use-entregas-de-venta'
import type { ResumenVenta } from '~/lib/api/entregas'

export default function AccionConfigurarEntrega() {
  const venta = useStoreVentaSeleccionada(s => s.venta)

  const { entregas: historial, loading: loadingHistorial } = useEntregasDeVenta(venta?.id)

  // Fallback: usar entregas embebidas de la venta cuando el query por-venta
  // no devuelve datos (ej: token temporalmente null tras refetch).
  const entregasEmbebidas = useMemo(() => {
    if (historial.length > 0) return []
    const embebidas = (venta as any)?.entregas
      || (venta as any)?.entregas_productos
      || (venta as any)?.entregasProductos
      || []
    // Normalizar: mapear {estado_entrega: {codigo}} y {estado_entrega: string} a codigo
    return embebidas.map((e: any) => ({
      ...e,
      estado_entrega_codigo: e?.estado_entrega?.codigo ?? e?.estado_entrega,
    }))
  }, [venta, historial])

  const hasPendiente = useMemo(() => {
    if (!venta) return false

    // Si tenemos historial detallado (con detalles), usarlo
    if (historial.length > 0) {
      const covered: Record<string, number> = {}
      for (const entrega of historial) {
        if (entrega.estado_entrega_codigo === 'ca') continue
        for (const d of entrega.detalles ?? []) {
          const id = String(d.unidad_derivada_venta_id)
          covered[id] = (covered[id] ?? 0) + (d.cantidad ?? 0)
        }
      }
      return (venta.productos_por_almacen ?? []).some((prod: any) =>
        (prod.unidades_derivadas ?? []).some((udv: any) =>
          Number(udv.cantidad ?? 0) - (covered[String(udv.id)] ?? 0) > 0
        )
      )
    }

    // Fallback: si hay entregas embebidas con estado pendiente, asumir hay pendiente
    if (entregasEmbebidas.length > 0) {
      return entregasEmbebidas.some((e: any) =>
        e.estado_entrega_codigo === 'pe' || e.estado_entrega_codigo === 'ec'
      )
    }

    return false
  }, [venta, historial, entregasEmbebidas])

  const hayEntregas = historial.length > 0 || entregasEmbebidas.length > 0

  const [openResumen,      setOpenResumen]      = useState(false)
  const [openProgramar,    setOpenProgramar]    = useState(false)
  const [tipoEntrega,      setTipoEntrega]      = useState<TipoEntregaCodigo>('de')
  const [cantidades,       setCantidades]       = useState<CantidadOverride[]>([])
  const [fechaProgramada,  setFechaProgramada]  = useState<string | null>(null)

  const ventaAdaptada: ResumenVenta | undefined = venta
    ? ({
        venta_id:                 venta.id,
        serie:                    venta.serie ?? '',
        numero:                   venta.numero ?? 0,
        venta_numero:             `${venta.serie ?? ''}-${venta.numero ?? ''}`,
        fecha:                    venta.fecha ?? '',
        cliente_nombre:           venta.cliente?.razon_social
                                    ?? `${venta.cliente?.nombres ?? ''} ${venta.cliente?.apellidos ?? ''}`.trim()
                                    ?? '',
        cliente_numero_documento: venta.cliente?.numero_documento ?? null,
        cliente_telefono:         venta.cliente?.telefono ?? null,
        total_entregas:           0,
        completadas:              0,
        en_camino:                0,
        pendientes:               0,
        canceladas:               0,
        proxima_fecha_programada: null,
        ultima_fecha_ejecutada:   null,
        sin_entregas:             true,
      } satisfies ResumenVenta)
    : undefined

  const handleProgramar = (tipo: TipoEntregaCodigo, newCantidades: CantidadOverride[], fecha: string | null) => {
    setTipoEntrega(tipo)
    setCantidades(newCantidades)
    setFechaProgramada(fecha)
    // No cerramos el Step 1 — queda abierto detrás del Step 2
    setOpenProgramar(true)
  }

  return (
    <>
      <ButtonBase
        className={`w-full min-h-10 flex items-center justify-center gap-2 font-semibold !text-sm text-center leading-tight !px-2 !py-1.5 ${
          !hasPendiente && hayEntregas
            ? 'border-green-500 !text-green-700 hover:bg-green-50'
            : 'border-blue-500 !text-blue-700 hover:bg-blue-50'
        }`}
        disabled={!venta || loadingHistorial || venta.estado_de_venta === 'an'}
        onClick={() => setOpenResumen(true)}
      >
        {loadingHistorial ? (
          <Spin size="small" />
        ) : !hasPendiente && hayEntregas ? (
          <><FaHistory size={13} /> Ver Historial</>
        ) : hasPendiente && hayEntregas ? (
          <><FaPlus size={14} /> Configurar Entrega e Historial</>
        ) : (
          <><FaPlus size={14} /> Configurar Entrega</>
        )}
      </ButtonBase>

      {/* Paso 1: resumen de productos + selector de tipo */}
      <ModalResumenEntregaVenta
        open={openResumen}
        onClose={() => setOpenResumen(false)}
        ventaId={venta?.id}
        ventaNumero={venta ? `${venta.serie}-${venta.numero}` : undefined}
        clienteNombre={
          venta?.cliente?.razon_social
          ?? `${venta?.cliente?.nombres ?? ''} ${venta?.cliente?.apellidos ?? ''}`.trim()
          ?? undefined
        }
        onAbrirConfiguracion={handleProgramar}
        // El modal NO se cierra al programar — el usuario lo cierra manualmente.
        // El refresco de la tabla de ventas lo hace invalidateQueries(VENTAS).
      />

      {/* Paso 2: configuración completa de la entrega */}
      <ModalNuevaEntregaVenta
        open={openProgramar}
        onClose={() => setOpenProgramar(false)}
        venta={ventaAdaptada}
        tipoEntrega={tipoEntrega}
        cantidadesOverride={cantidades}
        fechaProgramada={fechaProgramada}
        onSuccess={() => setOpenProgramar(false)}
      />
    </>
  )
}
