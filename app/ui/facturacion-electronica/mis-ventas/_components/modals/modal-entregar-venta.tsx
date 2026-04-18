'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { getVentaResponseProps } from '~/lib/api/venta'
import ModalSeleccionarTipoDespacho from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/modals/modal-seleccionar-tipo-despacho'
import ModalEntregaDirecta from './modal-entrega-directa'
import ModalEntregaDomicilio from './modal-entrega-domicilio'

export type TipoDespachoEntrega = 'EnTienda' | 'Domicilio' | 'Parcial'

interface ModalEntregarVentaProps {
  open: boolean
  setOpen: (open: boolean) => void
  venta?: getVentaResponseProps
}

/**
 * Detecta el tipo de despacho de la venta.
 * 1. Primero revisa venta.tipo_despacho (configurado al crear la venta)
 * 2. Si no existe, revisa las entregas existentes como fallback
 */
function detectarTipoDespacho(venta?: getVentaResponseProps): TipoDespachoEntrega | null {
  // Prioridad 1: tipo_despacho guardado en la venta
  if (venta?.tipo_despacho) {
    switch (venta.tipo_despacho) {
      case 'et': return 'EnTienda'
      case 'do': return 'Domicilio'
      case 'pa': return 'Parcial'
    }
  }

  // Prioridad 2: detectar desde entregas existentes (ventas antiguas)
  const entregas = venta?.entregas_productos ?? venta?.entregasProductos
  if (!entregas || entregas.length === 0) return null

  const ultima = entregas[entregas.length - 1]
  if (!ultima.tipo_entrega) return null

  switch (ultima.tipo_entrega) {
    case 'rt': return 'EnTienda'
    case 'de': return 'Domicilio'
    case 'pa': return 'Parcial'
    default: return null
  }
}

export default function ModalEntregarVenta({
  open,
  setOpen,
  venta,
}: ModalEntregarVentaProps) {
  const tipoDetectado = useMemo(() => detectarTipoDespacho(venta), [venta])

  const [paso, setPaso] = useState<'selector' | 'entrega'>('selector')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDespachoEntrega | null>(null)

  useEffect(() => {
    if (open) {
      // Si la venta ya tiene entregas con tipo, ir directo al modal
      if (tipoDetectado) {
        setTipoSeleccionado(tipoDetectado)
        setPaso('entrega')
      } else {
        setPaso('selector')
        setTipoSeleccionado(null)
      }
    } else {
      setPaso('selector')
      setTipoSeleccionado(null)
    }
  }, [open, tipoDetectado])

  const seleccionandoRef = useRef(false)

  const handleSelectTipo = (tipo: TipoDespachoEntrega) => {
    seleccionandoRef.current = true
    setTipoSeleccionado(tipo)
    setPaso('entrega')
  }

  const handleCloseEntrega = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false)
    }
  }

  const handleCambiarTipo = () => {
    setPaso('selector')
    setTipoSeleccionado(null)
  }

  const handleSetOpenSelector = (isOpen: boolean) => {
    if (!isOpen && seleccionandoRef.current) {
      seleccionandoRef.current = false
      return
    }
    setOpen(isOpen)
  }

  // Paso 1: Selector de tipo de despacho
  if (paso === 'selector') {
    return (
      <ModalSeleccionarTipoDespacho
        open={open}
        setOpen={handleSetOpenSelector}
        onSelectTipo={handleSelectTipo}
      />
    )
  }

  // Paso 2: Modal específico según tipo
  if (tipoSeleccionado === 'Domicilio') {
    return (
      <ModalEntregaDomicilio
        open={open}
        setOpen={handleCloseEntrega}
        venta={venta}
        onCambiarTipo={handleCambiarTipo}
      />
    )
  }

  // EnTienda y Parcial usan el modal de entrega directa
  return (
    <ModalEntregaDirecta
      open={open}
      setOpen={handleCloseEntrega}
      venta={venta}
      tipoDespacho={tipoSeleccionado ?? 'EnTienda'}
      onCambiarTipo={handleCambiarTipo}
    />
  )
}
