'use client'

/**
 * Provider del modal "Detalles de Entrega".
 *
 * Centraliza TODO el state local del modal (mostrarMapa, coordenadas,
 * direccionSeleccionada, productosEntrega, programarResto, slots, etc.) y
 * los handlers asociados.
 *
 * Las secciones (EnTienda / Domicilio / Parcial / Resto) consumen lo que
 * necesitan vía `useDetallesEntrega()` en lugar de recibir 30 props.
 *
 * Sub-fases del refactor:
 *   A.3.1 — Shell vacío.
 *   A.3.2 — Bloque "domicilio" ✅
 *   A.3.3 — Bloque "resto" ✅
 *   A.3.4 — Bloque "parcial" ✅
 *   A.3.5 — Slots + calendario ✅
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { TipoPedido } from '~/lib/api/entrega-producto'
import type { TipoDireccion } from '~/lib/api/cliente'
import type { ProductoEntrega } from '../../../../_hooks/use-productos-entrega'
import type { Coordenadas, VehiculoPreseleccionado } from './types'

// =============================================================================
// SHAPE — campos del context.
// =============================================================================

export interface DetallesEntregaContextValue {
  // ── Bloque DOMICILIO ────────────────────────────────────────────────────
  /** Si el usuario abrió el mapa de Mapbox para marcar coordenadas. */
  mostrarMapa: boolean
  setMostrarMapa: (v: boolean) => void
  /** Coordenadas seleccionadas (null si aún no marcó). */
  coordenadas: Coordenadas | null
  setCoordenadas: (v: Coordenadas | null) => void
  /** Tipo de dirección activa (D1/D2/D3/D4). */
  direccionSeleccionada: TipoDireccion | null
  setDireccionSeleccionada: (v: TipoDireccion | null) => void
  /** Vehículo precargado del usuario logueado (para mostrar el badge). */
  vehiculoPreseleccionadoDomicilio: VehiculoPreseleccionado | null
  setVehiculoPreseleccionadoDomicilio: (v: VehiculoPreseleccionado | null) => void
  /** Interno o Externo — usado en pedido a domicilio. */
  tipoPedido: TipoPedido
  setTipoPedido: (v: TipoPedido) => void
  /** Dirección humana obtenida por reverse geocoding del mapa. */
  ubicacionGps: string
  setUbicacionGps: (v: string) => void

  // ── Bloque RESTO (sección "Programar entrega del resto" del Parcial) ──
  /** Si el switch "¿Programar entrega del resto?" está activo. */
  programarResto: boolean
  setProgramarResto: (v: boolean) => void
  /** Hora de inicio para la entrega del resto. */
  horaInicioResto: string | undefined
  setHoraInicioResto: (v: string | undefined) => void
  /** Hora final para la entrega del resto. */
  horaFinResto: string | undefined
  setHoraFinResto: (v: string | undefined) => void
  /** Observaciones para la entrega del resto. */
  observacionesResto: string
  setObservacionesResto: (v: string) => void
  /** Si el mapa de la sección Resto está abierto. */
  mostrarMapaResto: boolean
  setMostrarMapaResto: (v: boolean) => void
  /** Coordenadas seleccionadas para el resto. */
  coordenadasResto: Coordenadas | null
  setCoordenadasResto: (v: Coordenadas | null) => void
  /** Tipo de dirección activa (D1/D2/D3/D4) para el resto. */
  direccionSeleccionadaResto: TipoDireccion | null
  setDireccionSeleccionadaResto: (v: TipoDireccion | null) => void
  /** Tipo de pedido (Interno/Externo) para el resto. */
  tipoPedidoResto: TipoPedido
  setTipoPedidoResto: (v: TipoPedido) => void
  /** Vehículo precargado para la sección Resto. */
  vehiculoPreseleccionadoResto: VehiculoPreseleccionado | null
  setVehiculoPreseleccionadoResto: (v: VehiculoPreseleccionado | null) => void
  /** Dirección humana obtenida por reverse geocoding (sección Resto). */
  ubicacionGpsResto: string
  setUbicacionGpsResto: (v: string) => void

  // ── Bloque PARCIAL (lista de productos a entregar ahora vs programar) ──
  /** Productos derivados de la venta con sus columnas de entrega/programar. */
  productosEntrega: ProductoEntrega[]
  setProductosEntrega: React.Dispatch<React.SetStateAction<ProductoEntrega[]>>
  /** Quién entrega ahora en el caso parcial — almacén o vendedor. */
  quienEntregaParcial: 'almacen' | 'vendedor'
  setQuienEntregaParcial: (v: 'almacen' | 'vendedor') => void

  // ── Bloque SLOTS + Modal calendario ────────────────────────────────────
  /** Si el modal de calendario para Domicilio está abierto. */
  modalCalendarioDomicilio: boolean
  setModalCalendarioDomicilio: (v: boolean) => void
  /** Si el modal de calendario para Resto está abierto. */
  modalCalendarioResto: boolean
  setModalCalendarioResto: (v: boolean) => void
  /** Slot {start,end} elegido en el calendario para Domicilio. */
  slotDomicilio: { start: Date; end: Date } | null
  setSlotDomicilio: (v: { start: Date; end: Date } | null) => void
  /** Slot {start,end} elegido en el calendario para Resto. */
  slotResto: { start: Date; end: Date } | null
  setSlotResto: (v: { start: Date; end: Date } | null) => void
}

// =============================================================================
// Context + Provider + Hook
// =============================================================================

const DetallesEntregaContext = createContext<DetallesEntregaContextValue | null>(null)

export function DetallesEntregaProvider({
  children,
}: {
  children: ReactNode
}) {
  // ── Bloque DOMICILIO ────────────────────────────────────────────────────
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null)
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<TipoDireccion | null>(null)
  const [vehiculoPreseleccionadoDomicilio, setVehiculoPreseleccionadoDomicilio] =
    useState<VehiculoPreseleccionado | null>(null)
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(TipoPedido.INTERNO)
  const [ubicacionGps, setUbicacionGps] = useState<string>('')

  // ── Bloque RESTO (sección "Programar entrega del resto" del Parcial) ──
  const [programarResto, setProgramarResto] = useState(false)
  const [horaInicioResto, setHoraInicioResto] = useState<string | undefined>(undefined)
  const [horaFinResto, setHoraFinResto] = useState<string | undefined>(undefined)
  const [observacionesResto, setObservacionesResto] = useState<string>('')
  const [mostrarMapaResto, setMostrarMapaResto] = useState(false)
  const [coordenadasResto, setCoordenadasResto] = useState<Coordenadas | null>(null)
  const [direccionSeleccionadaResto, setDireccionSeleccionadaResto] =
    useState<TipoDireccion | null>(null)
  const [tipoPedidoResto, setTipoPedidoResto] = useState<TipoPedido>(TipoPedido.INTERNO)
  const [vehiculoPreseleccionadoResto, setVehiculoPreseleccionadoResto] =
    useState<VehiculoPreseleccionado | null>(null)
  const [ubicacionGpsResto, setUbicacionGpsResto] = useState<string>('')

  // ── Bloque PARCIAL ─────────────────────────────────────────────────────
  const [productosEntrega, setProductosEntrega] = useState<ProductoEntrega[]>([])
  const [quienEntregaParcial, setQuienEntregaParcial] = useState<'almacen' | 'vendedor'>('almacen')

  // ── Bloque SLOTS + Modal calendario ────────────────────────────────────
  const [modalCalendarioDomicilio, setModalCalendarioDomicilio] = useState(false)
  const [modalCalendarioResto, setModalCalendarioResto] = useState(false)
  const [slotDomicilio, setSlotDomicilio] = useState<{ start: Date; end: Date } | null>(null)
  const [slotResto, setSlotResto] = useState<{ start: Date; end: Date } | null>(null)

  const value: DetallesEntregaContextValue = {
    // Domicilio
    mostrarMapa,
    setMostrarMapa,
    coordenadas,
    setCoordenadas,
    direccionSeleccionada,
    setDireccionSeleccionada,
    vehiculoPreseleccionadoDomicilio,
    setVehiculoPreseleccionadoDomicilio,
    tipoPedido,
    setTipoPedido,
    ubicacionGps,
    setUbicacionGps,
    // Resto
    programarResto,
    setProgramarResto,
    horaInicioResto,
    setHoraInicioResto,
    horaFinResto,
    setHoraFinResto,
    observacionesResto,
    setObservacionesResto,
    mostrarMapaResto,
    setMostrarMapaResto,
    coordenadasResto,
    setCoordenadasResto,
    direccionSeleccionadaResto,
    setDireccionSeleccionadaResto,
    tipoPedidoResto,
    setTipoPedidoResto,
    vehiculoPreseleccionadoResto,
    setVehiculoPreseleccionadoResto,
    ubicacionGpsResto,
    setUbicacionGpsResto,
    // Parcial
    productosEntrega,
    setProductosEntrega,
    quienEntregaParcial,
    setQuienEntregaParcial,
    // Slots + calendario
    modalCalendarioDomicilio,
    setModalCalendarioDomicilio,
    modalCalendarioResto,
    setModalCalendarioResto,
    slotDomicilio,
    setSlotDomicilio,
    slotResto,
    setSlotResto,
  }

  return (
    <DetallesEntregaContext.Provider value={value}>
      {children}
    </DetallesEntregaContext.Provider>
  )
}

/**
 * Hook para consumir el context.
 *
 * Tira un error explícito si se llama fuera del Provider — hace fallar rápido
 * en lugar de devolver `undefined` y romper en otro lado.
 */
export function useDetallesEntrega(): DetallesEntregaContextValue {
  const ctx = useContext(DetallesEntregaContext)
  if (!ctx) {
    throw new Error(
      'useDetallesEntrega() debe usarse dentro de <DetallesEntregaProvider>',
    )
  }
  return ctx
}
