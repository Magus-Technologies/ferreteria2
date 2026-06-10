'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Modal, Spin, App } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FaTruck } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi } from '~/lib/api/venta'
import { entregasNuevasApi, type EntregaNueva } from '~/lib/api/entregas'
import TableWithTitle from '~/components/tables/table-with-title'
import useEntregasDeVenta from '~/app/ui/facturacion-electronica/mis-entregas/_hooks/use-entregas-de-venta'
import ModalPdfEntregaWrapper from '~/app/ui/facturacion-electronica/mis-entregas/_components/modals/modal-pdf-entrega-wrapper'
import ModalNuevaEntregaVenta from '~/app/ui/facturacion-electronica/mis-entregas/_components/modals/modal-nueva-entrega-venta'
import { FilaProducto, useColsProductosPendientes } from '../tables/columns-productos-pendientes'
import { useColsHistorialEntrega } from '../tables/columns-historial-entrega'
import CardControlesEntrega from '../cards/card-controles-entrega'
import type { RecolectarEntregaConfig } from '../../crear-venta/_components/modals/detalles-entrega/types'

export type TipoEntregaCodigo = 'rt' | 'de' | 'pa'
export interface CantidadOverride { udvId: string; cantidad: number }

interface Props {
  open: boolean; onClose: () => void
  ventaId: string | undefined; ventaNumero?: string; clienteNombre?: string
  onAbrirConfiguracion: (t: TipoEntregaCodigo, c: CantidadOverride[], f: string | null) => void
  onSuccess?: () => void
}

const HH = 36

function filasIguales(a: FilaProducto[], b: FilaProducto[]) {
  if (a.length !== b.length) return false

  return a.every((actual, index) => {
    const siguiente = b[index]
    return (
      actual.key === siguiente.key &&
      actual.udvId === siguiente.udvId &&
      actual.nombre === siguiente.nombre &&
      actual.codigo === siguiente.codigo &&
      actual.marca === siguiente.marca &&
      actual.unidad === siguiente.unidad &&
      actual.total === siguiente.total &&
      actual.entregado === siguiente.entregado &&
      actual.pendiente === siguiente.pendiente
      // cantAProgramar is intentionally excluded: it's user-editable state,
      // not server data. Including it caused background refetches to overwrite
      // the user's typed quantity with the server's pendiente value.
    )
  })
}

export default function ModalResumenEntregaVenta({
  open, onClose, ventaId, ventaNumero, clienteNombre, onAbrirConfiguracion, onSuccess,
}: Props) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [tipo,          setTipo]          = useState<TipoEntregaCodigo>('de')
  const [fecha,         setFecha]         = useState<Dayjs | null>(dayjs())
  const [filas,         setFilas]         = useState<FilaProducto[]>([])
  // Ref síncrono para cantidades — evita stale closure cuando el usuario
  // tipea y hace clic en "Programar" antes de que React re-renderice.
  const cantidadesRef = useRef<Record<string, number>>({})
  const [quienEntrega,  setQuienEntrega]  = useState<'almacen' | 'vendedor'>('almacen')

  // Config de despacho a domicilio (dirección + GPS + fecha + chofer).
  // Se llena desde el modal rico "Agregar Entrega a Domicilio" en modo
  // recolectar — NO se crea la entrega hasta "Programar Entrega".
  const [domicilioConfig, setDomicilioConfig] = useState<RecolectarEntregaConfig | null>(null)
  const [openModalDomicilio, setOpenModalDomicilio] = useState(false)

  // Resetear dirección cuando cambia de tipo
  useEffect(() => {
    if (tipo !== 'de') setDomicilioConfig(null)
  }, [tipo])

  const { data: ventaResp, isLoading: isLoadingVenta } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'resumen-entrega', ventaId],
    queryFn:  () => ventaApi.getById(ventaId!),
    enabled:  open && !!ventaId,
    staleTime: 2 * 60 * 1000,  // 2 min — refetches en background sin bloquear la UI
  })
  const vd = (ventaResp?.data?.data ?? ventaResp?.data) as any

  const { entregas: historial, isLoadingFirst: isLoadingHistorial, refetch: refetchHistorial } = useEntregasDeVenta(open ? ventaId : undefined)

  // Cobertura acumulada desde el historial — TODOS los no-cancelados (pe+ec+en)
  // Se usa para mostrar pendiente/entregado correctos sin depender de cantidad_pendiente del DB
  const coveredMap = useMemo(() => {
    const covered: Record<string, number> = {}
    for (const entrega of historial) {
      if (entrega.estado_entrega_codigo === 'ca') continue
      for (const d of entrega.detalles ?? []) {
        const id = String(d.unidad_derivada_venta_id)
        covered[id] = (covered[id] ?? 0) + (d.cantidad ?? 0)
      }
    }
    return covered
  }, [historial])

  useEffect(() => {
    if (!vd) return
    const siguientesFilas = (vd.productos_por_almacen ?? []).flatMap((prod: any, pi: number) =>
      (prod.unidades_derivadas ?? []).map((udv: any, ui: number) => {
        const total    = Number(udv.cantidad ?? 0)
        const entregado = coveredMap[String(udv.id)] ?? 0
        const pendiente = Math.max(0, total - entregado)
        return {
          key: `${pi}-${ui}`, udvId: String(udv.id),
          nombre:   prod.producto_almacen?.producto?.name ?? 'Producto',
          codigo:   prod.producto_almacen?.producto?.cod_producto ?? '—',
          marca:    prod.producto_almacen?.producto?.marca?.name ?? '—',
          unidad:   udv.unidad_derivada_inmutable?.name ?? '—',
          total, entregado, pendiente, cantAProgramar: pendiente,
        }
      })
    )

    setFilas((prev) => {
      if (filasIguales(prev, siguientesFilas)) return prev
      // Server data changed (different pendiente/total/etc). Preserve the user's
      // cantAProgramar where possible, but cap it to the new pendiente so we never
      // try to deliver more than what's actually pending.
      const merged = siguientesFilas.map((siguiente: FilaProducto) => {
        const prevFila = prev.find(p => p.key === siguiente.key)
        const cantAProgramar = prevFila
          ? Math.min(prevFila.cantAProgramar, siguiente.pendiente)
          : siguiente.pendiente
        return { ...siguiente, cantAProgramar }
      })
      cantidadesRef.current = Object.fromEntries(merged.map((f: FilaProducto) => [f.key, f.cantAProgramar]))
      return merged
    })
  }, [vd, coveredMap])

  // Cuando se cambia a "En Tienda", poner toda la cantidad pendiente a programar
  useEffect(() => {
    if (tipo === 'rt') {
      setFilas(prev => {
        const updated = prev.map(f => ({ ...f, cantAProgramar: f.pendiente }))
        updated.forEach(f => { cantidadesRef.current[f.key] = f.cantAProgramar })
        return updated
      })
    }
  }, [tipo])

  const onChangeRef = useCallback((key: string, value: number) => {
    cantidadesRef.current[key] = value
  }, [])

  const onCommit = useCallback((key: string, value: number) => {
    cantidadesRef.current[key] = value
    setFilas(prev => prev.map(f => f.key === key ? { ...f, cantAProgramar: value } : f))
  }, [])

  const colsHistorial = useColsHistorialEntrega({ onRefetch: refetchHistorial, entregas: historial })

  const hasPendiente = useMemo(() => {
    if (!vd) return true
    const covered: Record<string, number> = {}
    for (const entrega of historial) {
      if (entrega.estado_entrega_codigo === 'ca') continue
      for (const d of entrega.detalles ?? []) {
        const id = String(d.unidad_derivada_venta_id)
        covered[id] = (covered[id] ?? 0) + (d.cantidad ?? 0)
      }
    }
    return (vd.productos_por_almacen ?? []).some((prod: any) =>
      (prod.unidades_derivadas ?? []).some((udv: any) =>
        Number(udv.cantidad ?? 0) - (covered[String(udv.id)] ?? 0) > 0
      )
    )
  }, [vd, historial])

  // "A Programar" siempre visible cuando hay pendiente (rt y de por igual)
  // En recojo en tienda la entrega es inmediata → "A entregar"; en domicilio se
  // agenda para una fecha → "A programar".
  const colsProductos = useColsProductosPendientes({
    onCommit,
    onChangeRef,
    includeAProgramar: hasPendiente,
    aProgramarLabel: tipo === 'rt' ? 'A entregar' : 'A programar',
  })

  const aProg    = filas.filter(f => f.cantAProgramar > 0)
  const totUnd   = aProg.reduce((s, f) => s + f.cantAProgramar, 0)

  const { mutate: registrar, isPending: registrando } = useMutation({
    mutationFn: () => entregasNuevasApi.crear({
      venta_id:          ventaId!,
      tipo_entrega:      tipo,
      tipo_despacho:     tipo === 'de' ? 'pr' : 'in',
      // Domicilio lo entrega un chofer; recojo en tienda lo decide el selector.
      tipo_pedido:       tipo === 'de' ? (domicilioConfig?.tipo_pedido ?? 'interno') : 'interno',
      quien_entrega:     tipo === 'de' ? 'chofer' : quienEntrega,
      almacen_salida_id: Number(vd?.almacen_id ?? vd?.almacen?.id ?? 0),
      // Para domicilio la fecha/hora vienen del modal de configuración; para
      // recojo en tienda, del DatePicker del propio resumen.
      fecha_programada:  tipo === 'de'
        ? (domicilioConfig?.fecha_programada ?? (fecha ? fecha.format('YYYY-MM-DD') : null))
        : (fecha ? fecha.format('YYYY-MM-DD') : null),
      hora_inicio:       tipo === 'de' ? domicilioConfig?.hora_inicio ?? null : null,
      hora_fin:          tipo === 'de' ? domicilioConfig?.hora_fin ?? null : null,
      chofer_id:         tipo === 'de' ? domicilioConfig?.chofer_id ?? null : null,
      vehiculo_id:       tipo === 'de' ? domicilioConfig?.vehiculo_id ?? null : null,
      cargo_destino:     tipo === 'de' ? domicilioConfig?.cargo_destino ?? null : null,
      direccion_entrega: tipo === 'de' ? domicilioConfig?.direccion_entrega ?? null : null,
      referencia_entrega: tipo === 'de' ? domicilioConfig?.referencia_entrega ?? null : null,
      latitud:           tipo === 'de' ? domicilioConfig?.latitud ?? null : null,
      longitud:          tipo === 'de' ? domicilioConfig?.longitud ?? null : null,
      observaciones:     tipo === 'de' ? domicilioConfig?.observaciones ?? null : null,
      productos:         filas
        .map(f => ({ ...f, cantAProgramar: cantidadesRef.current[f.key] ?? f.cantAProgramar }))
        .filter(f => f.cantAProgramar > 0)
        .map(f => ({ unidad_derivada_venta_id: parseInt(f.udvId), cantidad: f.cantAProgramar })),
      user_creador_id:   vd?.user?.id ?? vd?.user_id ?? '',
    }),
    onSuccess: () => {
      message.success('Entrega registrada')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      refetchHistorial()
      // Reseteamos la config de domicilio: el historial ya refleja la entrega
      // recién creada y el botón vuelve a "deshabilitado" para evitar re-crear
      // la misma config de un doble-click. El modal NO se cierra — queda abierto
      // hasta que el usuario lo cierre manualmente.
      setDomicilioConfig(null)
      onSuccess?.()
    },
    onError: (err: any) => message.error(err?.response?.data?.message ?? 'Error al registrar'),
  })

  const abrirConfig = () => {
    if (tipo === 'de') {
      setOpenModalDomicilio(true)
    } else {
      if (!aProg.length) return
      onAbrirConfiguracion(tipo, aProg.map(f => ({ udvId: f.udvId, cantidad: f.cantAProgramar })), fecha?.format('YYYY-MM-DD') ?? null)
    }
  }

  return (
    <>
    <Modal open={open} onCancel={onClose} width={1200} centered destroyOnHidden footer={null}
      styles={{ body: { padding: '12px 20px 20px', height: 560, display: 'flex', flexDirection: 'column' } }}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaTruck className="text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">
              {historial.length === 0
                ? 'Configurar Entrega'
                : hasPendiente
                  ? 'Configurar Entrega e Historial'
                  : 'Historial de Entregas'}
            </div>
            {ventaNumero && <div className="text-xs text-slate-500">{ventaNumero}{clienteNombre ? ` — ${clienteNombre}` : ''}</div>}
          </div>
        </div>
      }
    >
      {isLoadingVenta || isLoadingHistorial ? (
        <div className="flex items-center justify-center flex-1"><Spin size="large" /></div>
      ) : (
        <div className="flex gap-5 flex-1 min-h-0">

          {/* ═══ TABLAS ═══ */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">

            {/* Productos — 55% del alto */}
            <div style={{ flex: 3 }} className="min-h-0">
              <TableWithTitle<FilaProducto>
                id={tipo === 'de' ? 'entrega-productos-de-v1' : 'entrega-productos-rt-v1'}
                title="Productos de la venta"
                rowData={filas} columnDefs={colsProductos}
                rowSelection={false} withNumberColumn={false} pagination={false}
                persistColumnState={true} domLayout="normal" rowHeight={36} headerHeight={HH}
                isVisible={open} exportExcel={false} exportPdf={false}
                noRowsOverlayComponent={() => <div className="text-gray-400 text-sm">Sin productos</div>}
              />
            </div>

            {/* Historial — 45% del alto */}
            <div style={{ flex: 2 }} className="min-h-0">
              <TableWithTitle<EntregaNueva>
                id="entrega-historial-v4"
                title="Historial de entregas"
                extraTitle={historial.length > 0
                  ? <span className="text-xs text-slate-400 font-normal">· {historial.length} registro{historial.length !== 1 ? 's' : ''}</span>
                  : undefined}
                rowData={historial} columnDefs={colsHistorial}
                rowSelection={false} withNumberColumn={false} pagination={false}
                persistColumnState={true} domLayout="normal" rowHeight={48} headerHeight={HH}
                isVisible={open} exportExcel={false} exportPdf={false}
                noRowsOverlayComponent={() => <div className="text-gray-400 text-sm">Sin entregas registradas</div>}
              />
            </div>
          </div>

          <div className="w-px bg-slate-100 flex-shrink-0" />

          {/* ═══ CONTROLES ═══ */}
          <CardControlesEntrega
            tipo={tipo} onTipo={setTipo}
            fecha={fecha} onFecha={setFecha}
            quienEntrega={quienEntrega} onQuienEntrega={setQuienEntrega}
            itemCount={aProg.length} unidadCount={totUnd}
            registrando={registrando}
            onMapa={abrirConfig}
            onProgramar={() => registrar()}
            onCancelar={onClose}
            completada={!hasPendiente}
            domicilioConfigurado={domicilioConfig !== null}
            domicilioDireccion={domicilioConfig?.direccion_entrega ?? undefined}
          />
        </div>
      )}
    </Modal>

    <ModalPdfEntregaWrapper />

    {/* ── Modal rico "Agregar Entrega a Domicilio" (solo recolectar) ──────
        Reusa el modal de siempre (mapa + calendario + chofer) pero en modo
        recolectar: NO crea la entrega, solo devuelve la config para que
        "Programar Entrega" la cree junto con las cantidades. La tabla de
        productos va oculta — las cantidades ya se eligieron en este resumen. */}
    {ventaId && (
      <ModalNuevaEntregaVenta
        open={openModalDomicilio}
        onClose={() => setOpenModalDomicilio(false)}
        venta={{ venta_id: ventaId }}
        tipoEntrega="de"
        // Sin fecha pre-cargada: el slot (fecha + hora) se elige en el calendario
        // del modal. Pre-cargar solo la fecha armaba un slot fantasma "00:00 — 00:00".
        fechaProgramada={null}
        onRecolectar={(cfg) => {
          setDomicilioConfig(cfg)
          setOpenModalDomicilio(false)
        }}
      />
    )}
    </>
  )
}
