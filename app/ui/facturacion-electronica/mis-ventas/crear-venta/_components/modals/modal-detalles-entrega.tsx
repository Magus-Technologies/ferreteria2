'use client'

import { Modal, Form } from 'antd'
import { useEffect, useCallback, useMemo } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import TitleForm from '~/components/form/title-form'
// `useCreateVenta` se consume ahora dentro de `use-confirmar-entrega.ts`.
import type { FormCreateVenta } from '../others/body-vender'
import type { ProductoEntrega } from '../../../_hooks/use-productos-entrega'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { TipoDireccion } from '~/lib/api/cliente'
import ModalCalendarioSlot from './modal-calendario-slot'

dayjs.locale('es')

// Tipos viven en `./detalles-entrega/types.ts` (Fase A del refactor).
import type { ModalDetallesEntregaProps } from './detalles-entrega/types'
// Provider + hook para el state del modal (Fase A.3 — migración progresiva).
import {
  DetallesEntregaProvider,
  useDetallesEntrega,
} from './detalles-entrega/context'
// Hooks extraídos en Fase B.
import { useCargos } from './detalles-entrega/hooks/use-cargos'
import { useDireccionesCliente } from './detalles-entrega/hooks/use-direcciones-cliente'
import { usePrecargarVehiculo } from './detalles-entrega/hooks/use-precargar-vehiculo'
import { useReverseGeocoding } from './detalles-entrega/hooks/use-reverse-geocoding'
import { useTotalesParcial } from './detalles-entrega/hooks/use-totales-parcial'
import { useValidaciones } from './detalles-entrega/hooks/use-validaciones'
import { useConfirmarEntrega } from './detalles-entrega/hooks/use-confirmar-entrega'
// Column defs extraídos en Fase C.
import { makeColumnsDomicilio } from './detalles-entrega/columns/columns-domicilio'
import { makeColumnsResto } from './detalles-entrega/columns/columns-resto'
// Secciones JSX extraídas en Fase D.
import { SeccionEnTienda } from './detalles-entrega/secciones/seccion-en-tienda'
import { SeccionDomicilio } from './detalles-entrega/secciones/seccion-domicilio'
import { SeccionParcial } from './detalles-entrega/secciones/seccion-parcial'

// `ModalDetallesEntregaProps` se mudó a `./detalles-entrega/types.ts`.

/**
 * Wrapper público — provee el `DetallesEntregaProvider` para que el
 * componente interno y todas sus secciones puedan consumir el state
 * compartido vía `useDetallesEntrega()`.
 */
export default function ModalDetallesEntrega(props: ModalDetallesEntregaProps) {
  return (
    <DetallesEntregaProvider>
      <ModalDetallesEntregaInner {...props} />
    </DetallesEntregaProvider>
  )
}

function ModalDetallesEntregaInner({
  open,
  setOpen,
  form,
  ventaId,
  tipoDespacho,
  onConfirmar,
  onEditarCliente,
  direccion,
  clienteNombre,
  clienteId,
  ocultar = [],
  mode,
  productosIniciales,
  tituloOverride,
  infoExtra,
  accionesHeader,
}: ModalDetallesEntregaProps) {
  // Set de claves "a ocultar" — fácil de pasar a las secciones y consultar O(1).
  const ocultarSet = useMemo(() => new Set(ocultar), [ocultar])
  // Si no se pasa `mode`, se asume modo histórico `crear-venta` con el `ventaId` recibido.
  const resolvedMode = mode ?? { kind: 'crear-venta' as const, ventaId }
  // ── Bloques DOMICILIO + RESTO migrados al Provider (Fase A.3.2 / A.3.3)
  // Solo desestructuramos lo que el archivo principal aún consume — los
  // setters/state del Domicilio y Resto que ya solo se usan dentro de las
  // secciones se leen ahí mismo via useDetallesEntrega().
  const {
    // Domicilio (solo los efectos de pre-carga siguen acá)
    setCoordenadas,
    setUbicacionGps,
    setDireccionSeleccionada,
    // Resto
    programarResto,
    setHoraInicioResto,
    setHoraFinResto,
    setCoordenadasResto,
    setDireccionSeleccionadaResto,
    setUbicacionGpsResto,
    // Parcial
    productosEntrega, setProductosEntrega,
    // Slots + calendario
    modalCalendarioDomicilio, setModalCalendarioDomicilio,
    modalCalendarioResto, setModalCalendarioResto,
    setSlotDomicilio,
    setSlotResto,
  } = useDetallesEntrega()
  // (Todos los bloques de state ahora viven en el Provider.)

  // Submit del modal — extraído a hook (Fase E).
  // El modo `crear-venta` mantiene el comportamiento histórico. El modo
  // `actualizar-entrega` se usa al reusar este modal desde `mis-entregas`.
  const { handleConfirmar, handleOmitir, loading: creandoVenta } = useConfirmarEntrega({
    mode: resolvedMode,
    form,
    tipoDespacho,
    onSuccess: () => {
      setOpen(false)
      onConfirmar()
    },
    onOmitir: () => {
      setOpen(false)
      onConfirmar()
    },
  })

  // Catálogo de cargos para "pedido externo" — extraído a hook (Fase B).
  const { data: cargos = [] } = useCargos()

  // `handleTipoPedidoChange` se mudó a `secciones/seccion-domicilio.tsx`.

  // Direcciones del cliente (D1..D4) — extraído a hook (Fase B).
  const { direcciones, cargandoDirecciones } = useDireccionesCliente({
    open,
    clienteId,
    tipoDespacho,
  })

  // Precarga del vehículo del usuario logueado en Domicilio + Resto Parcial.
  // Extraído a hook (Fase B.3).
  usePrecargarVehiculo({ open, tipoDespacho, form })

  // Cargar dirección inicial cuando se abra el Parcial con programarResto activo
  useEffect(() => {
    if (!open || tipoDespacho !== 'Parcial' || !programarResto) return
    if (direcciones.length === 0) return
    // Si ya hay dirección en el form, no sobrescribir
    if (form.getFieldValue('_resto_direccion_entrega')) return

    const direccionSeleccionadaForm = form.getFieldValue('direccion_seleccionada') || 'D1'
    const direccionObj = direcciones.find(d => d.tipo === direccionSeleccionadaForm) || direcciones[0]

    if (direccionObj) {
      form.setFieldValue('_resto_direccion_entrega', direccionObj.direccion)
      form.setFieldValue('_resto_referencia_entrega', direccionObj.referencia || '')
      setDireccionSeleccionadaResto(direccionObj.tipo as TipoDireccion)

      if (direccionObj.latitud && direccionObj.longitud) {
        const coords = {
          lat: Number(direccionObj.latitud),
          lng: Number(direccionObj.longitud)
        }
        setCoordenadasResto(coords)
        form.setFieldValue('_resto_latitud', coords.lat)
        form.setFieldValue('_resto_longitud', coords.lng)
        obtenerUbicacionGpsResto(coords.lat, coords.lng)
      } else {
        setUbicacionGpsResto('')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipoDespacho, programarResto, direcciones, form])

  // Cargar dirección inicial cuando se abra el modal
  useEffect(() => {
    if (open && tipoDespacho === 'Domicilio' && direcciones.length > 0) {
      // Setear almacenero por defecto como quien entrega en domicilio
      if (!form.getFieldValue('quien_entrega')) {
        form.setFieldValue('quien_entrega', 'almacen')
      }
      // Buscar la dirección seleccionada en el formulario principal
      const direccionSeleccionadaForm = form.getFieldValue('direccion_seleccionada') || 'D1'
      const direccionObj = direcciones.find(d => d.tipo === direccionSeleccionadaForm)
      
      if (direccionObj) {
        // Cargar la dirección seleccionada y referencia
        form.setFieldValue('direccion_entrega', direccionObj.direccion)
        form.setFieldValue('referencia_entrega', direccionObj.referencia || '')
        setDireccionSeleccionada(direccionObj.tipo as TipoDireccion)
        
        // Si tiene coordenadas, cargarlas
        if (direccionObj.latitud && direccionObj.longitud) {
          const coords = {
            lat: Number(direccionObj.latitud),
            lng: Number(direccionObj.longitud)
          }
          setCoordenadas(coords)
          form.setFieldValue('latitud', coords.lat)
          form.setFieldValue('longitud', coords.lng)
          obtenerUbicacionGps(coords.lat, coords.lng)
        } else {
          setUbicacionGps('')
        }
      } else if (direcciones.length > 0) {
        // Si no encuentra la seleccionada, usar la primera (D1)
        const primeraDir = direcciones[0]
        form.setFieldValue('direccion_entrega', primeraDir.direccion)
        form.setFieldValue('referencia_entrega', primeraDir.referencia || '')
        setDireccionSeleccionada(primeraDir.tipo as TipoDireccion)

        if (primeraDir.latitud && primeraDir.longitud) {
          const coords = {
            lat: Number(primeraDir.latitud),
            lng: Number(primeraDir.longitud)
          }
          setCoordenadas(coords)
          form.setFieldValue('latitud', coords.lat)
          form.setFieldValue('longitud', coords.lng)
          obtenerUbicacionGps(coords.lat, coords.lng)
        } else {
          setUbicacionGps('')
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipoDespacho, direcciones, form])

  // Watchers + validaciones (Domicilio + Resto Parcial) — extraídos a hook.
  // `restoInvalido` requiere `totalAProgramar` que se calcula más abajo,
  // así que la llamada se hace luego (ver `useValidaciones` después de
  // `useTotalesParcial`). Aquí el placeholder. Esta organización quedará
  // limpia cuando se extraigan también las secciones (Fase D).

  // Obtener productos del formulario
  const productos = Form.useWatch('productos', form) as FormCreateVenta['productos']

  // Inicializar cantidades de entrega cuando se abre el modal en modo Parcial
  // Setear almacenero por defecto en EnTienda
  useEffect(() => {
    if (open && tipoDespacho === 'EnTienda' && !form.getFieldValue('quien_entrega')) {
      form.setFieldValue('quien_entrega', 'almacen')
    }
  }, [open, tipoDespacho, form])

  useEffect(() => {
    if (!open) return
    // Modo `actualizar-entrega` (mis-entregas): los productos vienen ya
    // pre-armados desde fuera (de la entrega existente), no del form.
    if (productosIniciales && productosIniciales.length > 0) {
      setProductosEntrega(productosIniciales)
      return
    }
    // Modo `crear-venta`: derivar productos del form de la venta.
    if ((tipoDespacho === 'Parcial' || tipoDespacho === 'Domicilio') && productos && productos.length > 0) {
      const items: ProductoEntrega[] = productos.map((p, index) => ({
        id: index + 1,
        producto: p.producto_name,
        ubicacion: '',
        total: Number(p.cantidad),
        entregado: 0,
        pendiente: Number(p.cantidad),
        entregar: 0,
        // Por defecto, todo el resto se programa (comportamiento histórico).
        // El usuario puede reducirlo en la tabla del resto para dejar pendientes "sin programar".
        entregar_programado: Number(p.cantidad),
        unidad_derivada_venta_id: p.unidad_derivada_id,
      }))
      setProductosEntrega(items)
    }
  }, [open, tipoDespacho, productos, productosIniciales])

  const handleEditarCliente = () => {
    onEditarCliente()
  }

  // Aplicar slot seleccionado desde el calendario (domicilio)
  const handleAplicarSlotDomicilio = (slot: { start: Date; end: Date }) => {
    setSlotDomicilio(slot)
    // Guardar como string para que getFieldsValue() lo lea correctamente
    form.setFieldValue('fecha_programada', dayjs(slot.start).format('YYYY-MM-DD'))
    form.setFieldValue('hora_inicio', dayjs(slot.start).format('HH:mm'))
    form.setFieldValue('hora_fin', dayjs(slot.end).format('HH:mm'))
  }

  // Aplicar slot seleccionado desde el calendario (resto parcial)
  const handleAplicarSlotResto = (slot: { start: Date; end: Date }) => {
    setSlotResto(slot)
    form.setFieldValue('_resto_fecha_programada', dayjs(slot.start).format('YYYY-MM-DD'))
    setHoraInicioResto(dayjs(slot.start).format('HH:mm'))
    setHoraFinResto(dayjs(slot.end).format('HH:mm'))
  }

  // `ubicacionGps` (dirección obtenida por reverse geocoding) vive ahora en
  // el Provider — se consume arriba con el resto del bloque DOMICILIO.

  // Reverse geocoding (Mapbox) — devuelve la dirección humana al setter
  // del context. Extraído a hook (Fase B.4).
  const obtenerUbicacionGps = useReverseGeocoding(setUbicacionGps)

  // Handlers de Domicilio y Resto (handleCoordenadaChange, handleDireccionChange,
  // handleTipoPedidoChangeResto, handleDireccionChangeResto, handleCoordenadaChangeResto)
  // viven ahora dentro de sus secciones (Fase D).
  //
  // `obtenerUbicacionGpsResto` se mantiene aquí porque lo usa el useEffect de
  // pre-carga de dirección inicial cuando se abre el Parcial con `programarResto` activo.
  const obtenerUbicacionGpsResto = useReverseGeocoding(setUbicacionGpsResto)

  // Setear tipo_despacho en el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      form.setFieldValue('tipo_despacho', tipoDespacho)
    }
  }, [open, tipoDespacho, form])

  // Handler para editar "Programar ahora" en la tabla de Domicilio.
  // Solo limita por total — lo que sobra queda como pendiente sin programar.
  const handleProgramarChangeDomicilio = useCallback((id: number, value: number | null) => {
    let newValue = Number(value) || 0
    if (newValue < 0) newValue = 0
    setProductosEntrega((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        if (newValue > p.total) newValue = p.total
        return { ...p, entregar_programado: newValue }
      })
    )
  }, [])

  // Column defs Domicilio — extraídos a archivo (Fase C).
  const columnDefsDomicilio = useMemo(
    () => makeColumnsDomicilio(handleProgramarChangeDomicilio),
    [handleProgramarChangeDomicilio],
  )

  // Handler para editar "Programar ahora" (entregar_programado) en la tabla del resto.
  // Valida que entregar + entregar_programado no exceda total; lo que sobra queda como pendiente sin programar.
  const handleProgramarChange = useCallback((id: number, value: number | null) => {
    let newValue = Number(value) || 0
    if (newValue < 0) newValue = 0
    setProductosEntrega((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const maxProgramable = Math.max(0, p.total - p.entregar)
        if (newValue > maxProgramable) newValue = maxProgramable
        return { ...p, entregar_programado: newValue }
      })
    )
  }, [])

  // Column defs Resto (Parcial) — extraídos a archivo (Fase C).
  const columnDefsResto = useMemo(
    () => makeColumnsResto(handleProgramarChange),
    [handleProgramarChange],
  )

  // Totales del modo Parcial — extraído a hook (Fase B.5).
  const { totalAEntregar, totalAProgramar, totalSinProgramar } = useTotalesParcial(productosEntrega)

  // Validaciones del form (Domicilio + Resto Parcial) — extraído a hook (Fase B.6).
  const {
    domicilioInvalido,
    restoInvalido,
    despachadorId,
    restoDespachadorId,
    restoDireccionEntrega,
  } = useValidaciones({ tipoDespacho, form, totalAProgramar })

  const getTipoDespachoLabel = () => {
    switch (tipoDespacho) {
      case 'EnTienda':
        return 'Despacho en Tienda'
      case 'Domicilio':
        return 'Despacho a Domicilio'
      case 'Parcial':
        return 'Despacho Parcial'
    }
  }

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span>CONFIGURAR ENTREGA</span>
            {accionesHeader}
          </div>
          <div className="text-sm font-normal text-gray-600 mt-1">
            {tituloOverride ?? getTipoDespachoLabel()}
          </div>
          {infoExtra && (
            <div className="text-xs font-normal text-gray-500 mt-0.5">
              {infoExtra}
            </div>
          )}
        </TitleForm>
      }
      open={open}
      onCancel={() => setOpen(false)}
      width={tipoDespacho === 'Parcial' || tipoDespacho === 'Domicilio' ? 950 : 800}
      centered
      footer={
        <div className="flex justify-end gap-2">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </ButtonBase>
          {(tipoDespacho === 'Parcial' || tipoDespacho === 'Domicilio') &&
            !ocultarSet.has('omitir') && (
              <ButtonBase
                color="warning"
                size="md"
                onClick={handleOmitir}
                disabled={creandoVenta}
              >
                {creandoVenta ? 'Procesando...' : 'Omitir'}
              </ButtonBase>
            )}
          <ButtonBase
            color="success"
            size="md"
            onClick={handleConfirmar}
            disabled={creandoVenta || (tipoDespacho === 'Parcial' && totalAEntregar === 0) || (tipoDespacho === 'Domicilio' && productosEntrega.length > 0 && totalAProgramar === 0) || domicilioInvalido || restoInvalido}
          >
            {creandoVenta
              ? 'Procesando...'
              : tipoDespacho === 'EnTienda'
              ? 'Entregar Ahora'
              : tipoDespacho === 'Parcial'
              ? 'Entregar'
              : 'Programar Entrega'}
          </ButtonBase>
        </div>
      }
    >
      <div className="space-y-4 py-4">
        {/* Campos para Despacho en Tienda */}
        {tipoDespacho === 'EnTienda' && <SeccionEnTienda ocultar={ocultarSet} />}

        {/* Campos para Despacho a Domicilio (solo Domicilio, ya no Parcial) */}
        {/* Sección Domicilio extraída a archivo (Fase D.2). */}
        {tipoDespacho === 'Domicilio' && (
          <SeccionDomicilio
            form={form}
            clienteNombre={clienteNombre}
            direccion={direccion}
            onEditarCliente={handleEditarCliente}
            direcciones={direcciones}
            cargandoDirecciones={cargandoDirecciones}
            cargos={cargos}
            columnDefsDomicilio={columnDefsDomicilio}
            totalAProgramar={totalAProgramar}
            totalSinProgramar={totalSinProgramar}
            ocultar={ocultarSet}
            tablaSimple={resolvedMode.kind === 'actualizar-entrega' || resolvedMode.kind === 'crear-entrega-resto'}
          />
        )}

        {/* Campos para Despacho Parcial - Tabla de productos */}
        {/* Sección Parcial extraída a archivo (Fase D.3). */}
        {tipoDespacho === 'Parcial' && (
          <SeccionParcial
            form={form}
            clienteNombre={clienteNombre}
            onEditarCliente={handleEditarCliente}
            direcciones={direcciones}
            cargandoDirecciones={cargandoDirecciones}
            cargos={cargos}
            columnDefsResto={columnDefsResto}
            totalAEntregar={totalAEntregar}
            totalAProgramar={totalAProgramar}
            totalSinProgramar={totalSinProgramar}
            restoDireccionEntrega={restoDireccionEntrega}
            ocultar={ocultarSet}
            tablaSimple={resolvedMode.kind === 'actualizar-entrega' || resolvedMode.kind === 'crear-entrega-resto'}
          />
        )}
      </div>

      {/* Modal de calendario para seleccionar slot - Domicilio */}
      <ModalCalendarioSlot
        open={modalCalendarioDomicilio}
        onClose={() => setModalCalendarioDomicilio(false)}
        onAplicar={handleAplicarSlotDomicilio}
        chofer_id={despachadorId}
      />

      {/* Modal de calendario para seleccionar slot - Resto Parcial */}
      <ModalCalendarioSlot
        open={modalCalendarioResto}
        onClose={() => setModalCalendarioResto(false)}
        onAplicar={handleAplicarSlotResto}
        chofer_id={restoDespachadorId}
      />
    </Modal>
  )
}
