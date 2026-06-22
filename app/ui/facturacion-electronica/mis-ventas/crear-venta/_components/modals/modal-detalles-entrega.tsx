'use client'

import { Modal, Form } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import ButtonBase from '~/components/buttons/button-base'
import TitleForm from '~/components/form/title-form'
// `useCreateVenta` se consume ahora dentro de `use-confirmar-entrega.ts`.
import type { FormCreateVenta } from '../others/body-vender'
import type { ProductoEntrega } from '../../../_hooks/use-productos-entrega'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { TipoDireccion } from '~/lib/api/cliente'
import { ventaApi } from '~/lib/api/venta'
import { TipoPedido } from '~/lib/api/entrega-producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalCalendarioSlot from './modal-calendario-slot'

dayjs.locale('es')

function esProductoEntregable(producto: FormCreateVenta['productos'][number]) {
  const tipoFila = producto?._tipo_fila
  if (tipoFila === 'vale_promocional' || tipoFila === 'paquete_cabecera') {
    return false
  }

  return (
    Number(producto?.producto_id) > 0 &&
    Number(producto?.unidad_derivada_id) > 0 &&
    Number(producto?.cantidad) > 0
  )
}

// Tipos viven en `./detalles-entrega/types.ts` (Fase A del refactor).
import type {
  ModalDetallesEntregaProps,
  TipoDespachoUI,
} from './detalles-entrega/types'
// Provider + hook para el state del modal (Fase A.3 — migración progresiva).
import {
  DetallesEntregaProvider,
  useDetallesEntrega,
} from './detalles-entrega/context'
// Hooks extraídos en Fase B.
import { useCargos } from './detalles-entrega/hooks/use-cargos'
import { useDireccionesCliente } from './detalles-entrega/hooks/use-direcciones-cliente'
import { usePrecargarVehiculo } from './detalles-entrega/hooks/use-precargar-vehiculo'
import { vehiculosApi } from '~/lib/api/catalogos'
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
  forzarProgramarRestoOn = false,
  soloEntregarEnTienda = false,
  tipoDespachoConfirmacion: tipoDespachoConfirmacionOverride,
  readonlyEntregarParcial = false,
  tituloModal,
  labelConfirmar,
  onRecolectar,
}: ModalDetallesEntregaProps) {
  const { message } = useApp()
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
    setMostrarMapa,
    vehiculoPreseleccionadoDomicilio,
    // Resto
    programarResto,
    setProgramarResto,
    setHoraInicioResto,
    setHoraFinResto,
    setCoordenadasResto,
    setDireccionSeleccionadaResto,
    setUbicacionGpsResto,
    setMostrarMapaResto,
    vehiculoPreseleccionadoResto,
    setVehiculoPreseleccionadoResto,
    // Parcial
    productosEntrega, setProductosEntrega,
    // Slots + calendario
    modalCalendarioDomicilio, setModalCalendarioDomicilio,
    modalCalendarioResto, setModalCalendarioResto,
    setSlotDomicilio,
    setSlotResto,
    setVehiculoPreseleccionadoDomicilio,
  } = useDetallesEntrega()

  // El switch "¿Programar entrega del resto?" arranca:
  //   - OFF en `actualizar-entrega` — el usuario confirma la entrega existente
  //     y decide manualmente si quiere split.
  //   - ON en `crear-venta` y `crear-entrega-resto` — en ambos casos el usuario
  //     tiene productos pendientes que necesita programar para después. En
  //     `crear-entrega-resto` los campos `_resto_*` ya vienen pre-cargados
  //     desde la entrega origen, así que tiene sentido que el switch esté ON
  //     y el usuario solo confirme o ajuste.
  //   - Excepción: si `forzarProgramarRestoOn` es true (entrega agrupada con
  //     hermanas programadas con pendientes), se enciende el toggle para que
  //     el usuario pueda ver/editar la programación existente.
  useEffect(() => {
    if (!open) return
    if (resolvedMode.kind === 'actualizar-entrega' && forzarProgramarRestoOn) {
      setProgramarResto(true)
    } else if (resolvedMode.kind === 'crear-entrega-resto') {
      setProgramarResto(true)
    } else {
      setProgramarResto(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resolvedMode.kind, forzarProgramarRestoOn])

  // En `crear-entrega-resto` (botón "Entregar Restante" en mis-entregas), al
  // PRENDER el switch "Programar resto" redistribuir automáticamente todo
  // a `entregar_programado` — el usuario está creando una entrega ya
  // completa para el restante, así que tiene sentido que todo vaya a
  // "programar" como default, no a "entregar ahora".
  //
  // En `actualizar-entrega` NO redistribuimos: el usuario está confirmando
  // una entrega Parcial existente y prefiere mantener su `entregar` en lo
  // pendiente; si quiere split, reduce manualmente "Entregar" y la sección
  // del resto le mostrará lo que va sobrando.
  useEffect(() => {
    if (!open) return
    if (resolvedMode.kind !== 'crear-entrega-resto') return
    setProductosEntrega((prev) =>
      prev.map((p) => {
        const disponible = Math.max(0, p.total - (p.entregado || 0))
        if (disponible <= 0) return p
        if (programarResto) {
          if (p.entregar >= disponible && p.entregar_programado === 0) {
            return { ...p, entregar: 0, entregar_programado: disponible }
          }
        } else {
          if (p.entregar === 0 && p.entregar_programado >= disponible) {
            return { ...p, entregar: disponible, entregar_programado: 0 }
          }
        }
        return p
      }),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programarResto, open, resolvedMode.kind])
  // (Todos los bloques de state ahora viven en el Provider.)

  // Submit del modal — extraído a hook (Fase E).
  // El modo `crear-venta` mantiene el comportamiento histórico. El modo
  // `actualizar-entrega` se usa al reusar este modal desde `mis-entregas`.
  const tipoDespachoConfirmacion: TipoDespachoUI = soloEntregarEnTienda
    ? 'EnTienda'
    : tipoDespachoConfirmacionOverride ?? tipoDespacho
  const { handleConfirmar, handleOmitir, loading: creandoVenta } = useConfirmarEntrega({
    mode: resolvedMode,
    form,
    tipoDespacho: tipoDespachoConfirmacion,
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
    const restoDireccionGuardada = form.getFieldValue('_resto_direccion_entrega')
    const restoReferenciaGuardada = form.getFieldValue('_resto_referencia_entrega')
    const restoLatitudGuardada = form.getFieldValue('_resto_latitud')
    const restoLongitudGuardada = form.getFieldValue('_resto_longitud')
    const restoTieneCoords =
      restoLatitudGuardada != null && restoLongitudGuardada != null

    // Guard "no sobrescribir si ya hay valores guardados en la entrega"
    // En `crear-entrega-resto` y `actualizar-entrega` los valores ya fueron
    // pre-cargados desde la entrega existente. En `crear-venta` normal, el
    // guard permite que el usuario edite manualmente antes de confirmar.
    if (resolvedMode.kind !== 'crear-venta' && restoDireccionGuardada) {
      const direccionSeleccionadaForm = form.getFieldValue('direccion_seleccionada') || 'D1'
      const direccionObj =
        direcciones.find((d) => d.direccion === restoDireccionGuardada) ||
        direcciones.find((d) => d.tipo === direccionSeleccionadaForm) ||
        direcciones[0]

      if (direccionObj) {
        setDireccionSeleccionadaResto(direccionObj.tipo as TipoDireccion)
      }

      if (restoReferenciaGuardada != null) {
        form.setFieldValue('_resto_referencia_entrega', restoReferenciaGuardada)
      }

      if (restoTieneCoords) {
        const coords = {
          lat: Number(restoLatitudGuardada),
          lng: Number(restoLongitudGuardada),
        }
        setCoordenadasResto(coords)
        setMostrarMapaResto(true)
        obtenerUbicacionGpsResto(coords.lat, coords.lng)
      } else {
        setCoordenadasResto(null)
        setMostrarMapaResto(false)
        setUbicacionGpsResto('')
      }
      return
    }
    // Si estamos en modo update/resto y ya tenemos valores guardados (referencia,
    // lat/lng), no sobrescribir con datos del cliente (que podrían haber cambiado)
    if (
      resolvedMode.kind === 'crear-entrega-resto' &&
      (restoDireccionGuardada || restoReferenciaGuardada)
    ) return

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
        setMostrarMapaResto(true)
      } else {
        setUbicacionGpsResto('')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipoDespacho, programarResto, direcciones, form, resolvedMode.kind])

  // Cargar dirección inicial cuando se abra el modal
  // ⚠️ IMPORTANTE: No sobrescribir si ya hay valores guardados (vienen de la entrega existente)
  useEffect(() => {
    if (open && tipoDespacho === 'Domicilio' && direcciones.length > 0) {
      // Setear almacenero por defecto como quien entrega en domicilio
      if (!form.getFieldValue('quien_entrega')) {
        form.setFieldValue('quien_entrega', 'almacen')
      }
      
      // 🚨 NO sobrescribir si ya hay valores de la entrega existente (mis-entregas)
      // En modo `actualizar-entrega` y `crear-entrega-resto`, los valores ya fueron
      // pre-cargados desde la entrega y no deben sobrescribirse con datos del cliente.
      const yaTieneDireccion = !!form.getFieldValue('direccion_entrega')
      const yaTieneReferencia = !!form.getFieldValue('referencia_entrega')
      const yaTieneCoords = 
        form.getFieldValue('latitud') != null && 
        form.getFieldValue('longitud') != null
      
      // También verificar campos de configuración de entrega que se pre-cargan
      // desde la entrega existente y no deben sobrescribirse
      const yaTieneDespachador = !!form.getFieldValue('despachador_id')
      const yaTieneVehiculo = form.getFieldValue('vehiculo_id') != null
      const yaTieneFecha = !!form.getFieldValue('fecha_programada')
      const yaTieneHorario = !!form.getFieldValue('hora_inicio') || !!form.getFieldValue('hora_fin')
      
      // Si ya tiene TODOS los campos críticos, no hacer nada
      // Si la entrega existente ya trae GPS desde BD, sincronizarlo con el
      // estado visual del mapa antes de salir por los guards de precarga.
      if (yaTieneCoords) {
        const coords = {
          lat: Number(form.getFieldValue('latitud')),
          lng: Number(form.getFieldValue('longitud')),
        }

        if (Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
          const direccionActual = form.getFieldValue('direccion_entrega')
          const direccionSeleccionadaForm = form.getFieldValue('direccion_seleccionada') || 'D1'
          const direccionObj =
            direcciones.find(d => d.direccion === direccionActual) ||
            direcciones.find(d => d.tipo === direccionSeleccionadaForm)

          if (direccionObj) {
            setDireccionSeleccionada(direccionObj.tipo as TipoDireccion)
            form.setFieldValue('direccion_seleccionada', direccionObj.tipo)
          }

          setCoordenadas(coords)
          obtenerUbicacionGps(coords.lat, coords.lng)
          setMostrarMapa(true)
        }
      }

      if (yaTieneDireccion && yaTieneReferencia && yaTieneCoords && 
          yaTieneDespachador && yaTieneVehiculo && yaTieneFecha && yaTieneHorario) return
      
      // En modo `actualizar-entrega` o `crear-entrega-resto`, NO sobrescribir
      // NADA si ya hay datos (vienen de la entrega existente en BD)
      if (resolvedMode.kind === 'actualizar-entrega' || resolvedMode.kind === 'crear-entrega-resto') {
        // Para estos modos, solo cargar lo que falte Y venga de datos del cliente
        if (!yaTieneDireccion || !yaTieneReferencia || !yaTieneCoords) {
          const direccionActual = form.getFieldValue('direccion_entrega')
          const direccionSeleccionadaForm = form.getFieldValue('direccion_seleccionada') || 'D1'
          const direccionObj =
            direcciones.find(d => d.direccion === direccionActual) ||
            direcciones.find(d => d.tipo === direccionSeleccionadaForm)
          
          if (direccionObj) {
            setDireccionSeleccionada(direccionObj.tipo as TipoDireccion)
            form.setFieldValue('direccion_seleccionada', direccionObj.tipo)
            if (!yaTieneDireccion) {
              form.setFieldValue('direccion_entrega', direccionObj.direccion)
            }
            if (!yaTieneReferencia) {
              form.setFieldValue('referencia_entrega', direccionObj.referencia || '')
            }
            if (!yaTieneCoords && direccionObj.latitud && direccionObj.longitud) {
              const coords = {
                lat: Number(direccionObj.latitud),
                lng: Number(direccionObj.longitud)
              }
              setCoordenadas(coords)
              form.setFieldValue('latitud', coords.lat)
              form.setFieldValue('longitud', coords.lng)
              obtenerUbicacionGps(coords.lat, coords.lng)
              setMostrarMapa(true)
            }
          }
        }
        return
      }
      
      // Para `crear-venta` (nuevo), usar el comportamiento original:
      // cargar todos los campos desde las direcciones del cliente
      // Buscar la dirección seleccionada en el formulario principal
      const direccionSeleccionadaForm = form.getFieldValue('direccion_seleccionada') || 'D1'
      const direccionObj = direcciones.find(d => d.tipo === direccionSeleccionadaForm)
      
      if (direccionObj) {
        // Cargar la dirección seleccionada y referencia
        if (!yaTieneDireccion) {
          form.setFieldValue('direccion_entrega', direccionObj.direccion)
        }
        if (!yaTieneReferencia) {
          form.setFieldValue('referencia_entrega', direccionObj.referencia || '')
        }
        setDireccionSeleccionada(direccionObj.tipo as TipoDireccion)

        // Si tiene coordenadas y no las teníamos, cargarlas y abrir el mapa automáticamente.
        if (direccionObj.latitud && direccionObj.longitud && !yaTieneCoords) {
          const coords = {
            lat: Number(direccionObj.latitud),
            lng: Number(direccionObj.longitud)
          }
          setCoordenadas(coords)
          form.setFieldValue('latitud', coords.lat)
          form.setFieldValue('longitud', coords.lng)
          obtenerUbicacionGps(coords.lat, coords.lng)
          setMostrarMapa(true)
        } else if (!yaTieneCoords) {
          setUbicacionGps('')
        }
      } else if (direcciones.length > 0) {
        // Si no encuentra la seleccionada, usar la primera (D1)
        const primeraDir = direcciones[0]
        if (!yaTieneDireccion) {
          form.setFieldValue('direccion_entrega', primeraDir.direccion)
        }
        if (!yaTieneReferencia) {
          form.setFieldValue('referencia_entrega', primeraDir.referencia || '')
        }
        setDireccionSeleccionada(primeraDir.tipo as TipoDireccion)

        if (primeraDir.latitud && primeraDir.longitud && !yaTieneCoords) {
          const coords = {
            lat: Number(primeraDir.latitud),
            lng: Number(primeraDir.longitud)
          }
          setCoordenadas(coords)
          form.setFieldValue('latitud', coords.lat)
          form.setFieldValue('longitud', coords.lng)
          obtenerUbicacionGps(coords.lat, coords.lng)
          setMostrarMapa(true)
        } else if (!yaTieneCoords) {
          setUbicacionGps('')
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipoDespacho, direcciones, form, resolvedMode.kind])

  // Watchers + validaciones (Domicilio + Resto Parcial) — extraídos a hook.
  // `restoInvalido` requiere `totalAProgramar` que se calcula más abajo,
  // así que la llamada se hace luego (ver `useValidaciones` después de
  // `useTotalesParcial`). Aquí el placeholder. Esta organización quedará
  // limpia cuando se extraigan también las secciones (Fase D).

  // Obtener productos del formulario
  const productos = Form.useWatch('productos', form) as FormCreateVenta['productos']

  // En modo `editar venta` (crear-venta con ventaId), leer la venta del backend
  // para conocer cuánto se entregó previamente. El backend mantiene
  // `cantidad_pendiente` por unidad_derivada_venta_id; lo entregado acumulado
  // en entregas previas = cantidad_BD − cantidad_pendiente.
  //
  // En venta nueva (sin ventaId) este query queda deshabilitado y todo cae al
  // comportamiento histórico (entregado = 0).
  const ventaIdParaConsulta =
    resolvedMode.kind === 'crear-venta' ? resolvedMode.ventaId : undefined
  const { data: ventaResponse } = useQuery({
    queryKey: [QueryKeys.VENTAS, 'detalle-entrega', ventaIdParaConsulta],
    queryFn: () => ventaApi.getById(ventaIdParaConsulta!),
    enabled: !!ventaIdParaConsulta && open,
  })

  // Mapa "(producto_id):(unidad_derivada_name)" → { cantidadBd, pendienteBd }.
  //
  // Match por NOMBRE de unidad porque el form usa `unidad_derivada_id` que
  // apunta al CATÁLOGO de unidades del producto (id 1=UNIDAD, 2=CAJA, etc.),
  // mientras que la BD `unidad_derivada_inmutable_venta.id` es la PK del
  // snapshot inmutable de la venta (id 47 acá, no compatible con el form).
  // El page de editar-venta solo deriva `unidad_derivada_normal.id` localmente
  // buscando por `name`, así que reproducimos ese match por nombre acá.
  const datosEntregaPorUnidad = useMemo(() => {
    const map = new Map<string, { cantidadBd: number; pendienteBd: number }>()
    const venta: any = ventaResponse?.data?.data
    const productosPorAlmacen = venta?.productos_por_almacen
    if (!Array.isArray(productosPorAlmacen)) return map
    for (const pa of productosPorAlmacen) {
      const productoId =
        pa?.producto_almacen?.producto_id ?? pa?.producto_almacen?.producto?.id
      const unidades = pa?.unidades_derivadas
      if (productoId == null || !Array.isArray(unidades)) continue
      for (const ud of unidades) {
        const unidadNombre = ud?.unidad_derivada_inmutable?.name
        if (!unidadNombre) continue
        const key = `${productoId}:${unidadNombre}`
        const cantidadBd = Number(ud?.cantidad ?? 0)
        const pendienteRaw = ud?.cantidad_pendiente
        const pendienteBd =
          pendienteRaw == null ? cantidadBd : Number(pendienteRaw)
        const existing = map.get(key)
        if (existing) {
          // Caso raro: dos unidades del mismo nombre y producto. Sumar.
          map.set(key, {
            cantidadBd: existing.cantidadBd + cantidadBd,
            pendienteBd: existing.pendienteBd + pendienteBd,
          })
        } else {
          map.set(key, { cantidadBd, pendienteBd })
        }
      }
    }
    return map
  }, [ventaResponse])

  // Inicializar cantidades de entrega cuando se abre el modal en modo Parcial
  // Sanitizar quien_entrega en EnTienda: solo admite 'almacen'/'vendedor'.
  // Si viene 'chofer' (ej. venta editada que tenía entrega a domicilio) hay
  // que resetearlo, porque el Select de EnTienda no tiene esa opción y AntD
  // mostraría el valor crudo "CHOFER".
  useEffect(() => {
    if (open && tipoDespacho === 'EnTienda') {
      const actual = form.getFieldValue('quien_entrega')
      if (actual !== 'almacen' && actual !== 'vendedor') {
        form.setFieldValue('quien_entrega', 'almacen')
      }
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
    const productosEntregables = productos?.filter(esProductoEntregable) ?? []

    if ((tipoDespacho === 'Parcial' || tipoDespacho === 'Domicilio') && productosEntregables.length > 0) {
      const items: ProductoEntrega[] = productosEntregables.map((p, index) => {
        const total = Number(p.cantidad)
        // Si la venta YA existe en BD (modo editar), descontar lo entregado
        // en entregas previas. `entregadoYa = cantidadBd − pendienteBd`.
        // En venta nueva el mapa está vacío y `entregadoYa = 0`.
        const lookupKey = `${p.producto_id}:${p.unidad_derivada_name}`
        const datosBd = datosEntregaPorUnidad.get(lookupKey)
        const entregadoYa = datosBd
          ? Math.max(0, datosBd.cantidadBd - datosBd.pendienteBd)
          : 0
        const pendiente = Math.max(0, total - entregadoYa)
        const esProductoNuevoEnEdicion = !!ventaIdParaConsulta && !datosBd
        // Venta nueva (!ventaIdParaConsulta): entregar todo ahora por defecto.
        // Editar-venta + producto nuevo: ídem.
        // Editar-venta + producto existente: programar el resto por defecto.

        const recibido = datosBd ? Math.max(0, datosBd.cantidadBd - total) : 0

        if (tipoDespacho === 'Domicilio') {
          return {
            id: index + 1,
            producto: p.producto_name,
            ubicacion: '',
            total,
            recibido,
            entregado: entregadoYa,
            pendiente,
            entregar: 0,
            entregar_programado: pendiente,
            unidad_derivada_venta_id: p.unidad_derivada_id,
          }
        }
        const debeEntregarAhora = esProductoNuevoEnEdicion || !ventaIdParaConsulta
        return {
          id: index + 1,
          producto: p.producto_name,
          ubicacion: '',
          total,
          recibido,
          entregado: entregadoYa,
          pendiente,
          entregar: debeEntregarAhora ? pendiente : 0,
          entregar_programado: debeEntregarAhora ? 0 : pendiente,
          unidad_derivada_venta_id: p.unidad_derivada_id,
        }
      })
      setProductosEntrega(items)
    }
  }, [open, tipoDespacho, productos, productosIniciales, datosEntregaPorUnidad])

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

  // Inicializar slotDomicilio desde valores del form cuando viene de una entrega existente
  // Usa entregaId como dependencia para asegurar que modal-entrega-update ya settó valores
  useEffect(() => {
    if (!open) return
    // Solo en modo actualizar/resto donde ya hay fecha/hora guardadas
    if (resolvedMode.kind !== 'actualizar-entrega' && resolvedMode.kind !== 'crear-entrega-resto') return
    
    // En modo actualizar, esperar a que entregaId esté disponible (modal-entrega-update settó valores)
    // En modo crear-venta, no necesitamos esperar ya que el form empieza vacío
    if (resolvedMode.kind === 'actualizar-entrega' && resolvedMode.entregaId) {
      // Esperar un tick para que el form se actualice después de setFieldsValue
      const timer = setTimeout(() => {
        const fecha = form.getFieldValue('fecha_programada')
        const horaInicio = form.getFieldValue('hora_inicio')
        const horaFin = form.getFieldValue('hora_fin')
        
        if (fecha && horaInicio && horaFin) {
          const fechaStr = dayjs(fecha).format('YYYY-MM-DD')
          const startDate = dayjs(`${fechaStr} ${horaInicio}`, 'YYYY-MM-DD HH:mm').toDate()
          const endDate = dayjs(`${fechaStr} ${horaFin}`, 'YYYY-MM-DD HH:mm').toDate()
          setSlotDomicilio({ start: startDate, end: endDate })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    
    // Para crear-venta o crear-entrega-resto, usar lógica simple
    const fecha = form.getFieldValue('fecha_programada')
    const horaInicio = form.getFieldValue('hora_inicio')
    const horaFin = form.getFieldValue('hora_fin')
    
    if (fecha && horaInicio && horaFin) {
      const fechaStr = dayjs(fecha).format('YYYY-MM-DD')
      const startDate = dayjs(`${fechaStr} ${horaInicio}`, 'YYYY-MM-DD HH:mm').toDate()
      const endDate = dayjs(`${fechaStr} ${horaFin}`, 'YYYY-MM-DD HH:mm').toDate()
      setSlotDomicilio({ start: startDate, end: endDate })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resolvedMode.kind, resolvedMode.kind === 'actualizar-entrega' ? resolvedMode.entregaId : null])

  // Inicializar vehiculoPreseleccionadoDomicilio si hay vehiculo_id guardado
  // Usa timeout para asegurar que el form ya se actualizó después de setFieldsValue
  useEffect(() => {
    if (!open) return
    if (resolvedMode.kind !== 'actualizar-entrega' && resolvedMode.kind !== 'crear-entrega-resto') return
    
    // Esperar a que modal-entrega-update termine de setters valores
    const timer = setTimeout(() => {
      const vehiculoIdValue = form.getFieldValue('vehiculo_id')
      if (
        vehiculoIdValue &&
        String(vehiculoPreseleccionadoDomicilio?.id ?? '') !== String(vehiculoIdValue)
      ) {
        vehiculosApi.getById(vehiculoIdValue).then((response) => {
          const vehiculoData = (response.data as any)?.data ?? response.data
          if (vehiculoData) {
            setVehiculoPreseleccionadoDomicilio({
              id: vehiculoData.id,
              name: vehiculoData.name,
              tipo: vehiculoData.tipo,
              placa: vehiculoData.placa || null,
            })
          }
        }).catch(console.error)
      } else if (!vehiculoIdValue) {
        setVehiculoPreseleccionadoDomicilio(null)
      }
    }, 150)
    
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    resolvedMode.kind,
    resolvedMode.kind === 'actualizar-entrega' ? resolvedMode.entregaId : null,
    vehiculoPreseleccionadoDomicilio?.id,
  ])

  // Inicializar slotResto desde los campos `_resto_*` cuando el parcial ya
  // viene programado desde mis-entregas. Sin esto, la UI muestra el switch
  // activo pero pierde despachador/vehículo/horario aunque existan en BD.
  useEffect(() => {
    if (!open || tipoDespacho !== 'Parcial' || !programarResto) return
    const fecha = form.getFieldValue('_resto_fecha_programada')
    const horaInicio = form.getFieldValue('_resto_hora_inicio') || form.getFieldValue('hora_inicio')
    const horaFin = form.getFieldValue('_resto_hora_fin') || form.getFieldValue('hora_fin')

    if (fecha && horaInicio && horaFin) {
      const fechaStr = dayjs(fecha).format('YYYY-MM-DD')
      const startDate = dayjs(`${fechaStr} ${horaInicio}`, 'YYYY-MM-DD HH:mm').toDate()
      const endDate = dayjs(`${fechaStr} ${horaFin}`, 'YYYY-MM-DD HH:mm').toDate()
      setSlotResto({ start: startDate, end: endDate })
    }
  }, [open, tipoDespacho, programarResto, form, setSlotResto])

  // Inicializar vehículo preseleccionado del resto desde `_resto_vehiculo_id`.
  useEffect(() => {
    if (!open || tipoDespacho !== 'Parcial' || !programarResto) return

    const timer = setTimeout(() => {
      const vehiculoIdValue = form.getFieldValue('_resto_vehiculo_id')
      if (
        vehiculoIdValue &&
        String(vehiculoPreseleccionadoResto?.id ?? '') !== String(vehiculoIdValue)
      ) {
        vehiculosApi.getById(vehiculoIdValue).then((response) => {
          const vehiculoData = (response.data as any)?.data ?? response.data
          if (vehiculoData) {
            setVehiculoPreseleccionadoResto({
              id: vehiculoData.id,
              name: vehiculoData.name,
              tipo: vehiculoData.tipo,
              placa: vehiculoData.placa || null,
            })
          }
        }).catch(console.error)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [
    open,
    tipoDespacho,
    programarResto,
    form,
    setVehiculoPreseleccionadoResto,
    vehiculoPreseleccionadoResto?.id,
  ])

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

  const handleExcluirDomicilio = useCallback((id: number) => {
    setProductosEntrega((prev) => {
      const afterExclude = prev.map((p) =>
        p.id === id ? { ...p, excluido: true, entregar_programado: 0 } : p
      )
      const hasProgrammed = afterExclude.some((p) => !p.excluido && p.entregar_programado > 0)
      if (!hasProgrammed) {
        return afterExclude.map((p) =>
          !p.excluido ? { ...p, entregar_programado: p.total } : p
        )
      }
      return afterExclude
    })
  }, [])

  const mostrarRecibidoDomicilio = productosEntrega.some((p) => Number(p.recibido || 0) > 0)

  // Column defs Domicilio — extraídos a archivo (Fase C).
  const columnDefsDomicilio = useMemo(
    () => makeColumnsDomicilio(handleProgramarChangeDomicilio, handleExcluirDomicilio, mostrarRecibidoDomicilio),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleProgramarChangeDomicilio, handleExcluirDomicilio, mostrarRecibidoDomicilio],
  )

  // Handler para editar "Programar ahora" (entregar_programado) en la tabla del resto.
  // Valida que entregar + entregar_programado + entregado no exceda total.
  // En `crear-venta` `entregado=0` así que el cálculo se simplifica a
  // `total - entregar`. En `crear-entrega-resto` `entregado` refleja lo que
  // ya se entregó en entregas anteriores y debe descontarse.
  const handleProgramarChange = useCallback((id: number, value: number | null) => {
    let newValue = Number(value) || 0
    if (newValue < 0) newValue = 0
    setProductosEntrega((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const maxProgramable = Math.max(0, p.total - p.entregar - (p.entregado || 0))
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
    vehiculoId,
    restoVehiculoId,
    direccionEntrega,
    latitud,
    longitud,
    cargoDestino,
    restoCargoDestino,
    restoDireccionEntrega,
    restoLatitud,
    restoLongitud,
  } = useValidaciones({ tipoDespacho, form, totalAProgramar })

  const { tipoPedido, slotDomicilio, tipoPedidoResto, slotResto } = useDetallesEntrega()

  const faltantes = useMemo(() => {
    const items: string[] = []
    // La dirección no es obligatoria si hay coordenadas GPS — el mapa
    // muestra la ubicación y la referencia puede guiar al despachador.
    const tieneDireccionOGps = !!direccionEntrega?.trim() || (latitud != null && longitud != null)
    const restoTieneDireccionOGps = !!restoDireccionEntrega?.trim() || (restoLatitud != null && restoLongitud != null)
    if (tipoDespacho === 'Domicilio') {
      if (!slotDomicilio) items.push('Elegir fecha y hora en el calendario')
      if (!tieneDireccionOGps) items.push('Dirección de entrega o ubicación GPS')
      if (!vehiculoId) items.push('Vehículo')
      if (tipoPedido === TipoPedido.INTERNO && !despachadorId) items.push('Despachador')
      if (tipoPedido === TipoPedido.EXTERNO && !cargoDestino) items.push('Cargo de destino')
    }
    if (tipoDespacho === 'Parcial') {
      if (!slotDomicilio) items.push('Elegir fecha y hora en el calendario')
      if (!tieneDireccionOGps) items.push('Dirección de entrega o ubicación GPS')
      if (!vehiculoId) items.push('Vehículo')
      if (tipoPedido === TipoPedido.INTERNO && !despachadorId) items.push('Despachador')
      if (tipoPedido === TipoPedido.EXTERNO && !cargoDestino) items.push('Cargo de destino')
      if (programarResto && totalAProgramar > 0) {
        if (!slotResto) items.push('Elegir fecha y hora del resto en el calendario')
        if (!restoTieneDireccionOGps) items.push('Dirección de entrega del resto o ubicación GPS')
        if (tipoPedidoResto === TipoPedido.EXTERNO && !restoCargoDestino) items.push('Cargo de destino del resto')
      }
    }
    return items
  }, [tipoDespacho, slotDomicilio, direccionEntrega, latitud, longitud, vehiculoId, tipoPedido, despachadorId, cargoDestino, programarResto, totalAProgramar, slotResto, restoDireccionEntrega, restoLatitud, restoLongitud, tipoPedidoResto, restoCargoDestino])

  // Sincronizar despachadorId (del SelectDespachadores) con el form
  // para que los guards de "ya tiene" funcionen correctamente
  // Solo sincroniza si el valor del form está vacío y despachadorId tiene valor
  // (evita loop circular con modal-entrega-update que ya seteó el valor)
  useEffect(() => {
    const formValue = form.getFieldValue('despachador_id')
    if (despachadorId && !formValue) {
      form.setFieldValue('despachador_id', String(despachadorId))
    }
  }, [despachadorId, form])

  // Sincronizar restoDespachadorId con el form
  // Solo sincroniza si el valor del form está vacío
  useEffect(() => {
    const formValue = form.getFieldValue('_resto_despachador_id')
    if (restoDespachadorId && !formValue) {
      form.setFieldValue('_resto_despachador_id', String(restoDespachadorId))
    }
  }, [restoDespachadorId, form])

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

  // Modo "solo recolectar": en vez de crear/actualizar la entrega, lee los
  // datos del despacho del form y los devuelve al padre. No toca el backend.
  const handleRecolectar = useCallback(() => {
    if (!onRecolectar) return
    const v = form.getFieldsValue()
    onRecolectar({
      direccion_entrega: v.direccion_entrega || null,
      referencia_entrega: v.referencia_entrega || null,
      latitud: v.latitud != null ? Number(v.latitud) : null,
      longitud: v.longitud != null ? Number(v.longitud) : null,
      fecha_programada: v.fecha_programada
        ? dayjs(v.fecha_programada).format('YYYY-MM-DD')
        : null,
      hora_inicio: v.hora_inicio || null,
      hora_fin: v.hora_fin || null,
      chofer_id: v.despachador_id || null,
      vehiculo_id: v.vehiculo_id != null ? Number(v.vehiculo_id) : null,
      tipo_pedido: v.tipo_pedido || null,
      cargo_destino: v.cargo_destino || null,
      observaciones: v.observaciones || null,
    })
    setOpen(false)
  }, [onRecolectar, form, setOpen])

  const handleConfirmarConFeedback = useCallback(async () => {
    // Si el modal está en modo recolectar, no creamos nada — devolvemos la config.
    if (onRecolectar) {
      handleRecolectar()
      return
    }
    try {
      await handleConfirmar()
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo confirmar la entrega',
      )
    }
  }, [onRecolectar, handleRecolectar, handleConfirmar, message])

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span>{tituloModal ?? 'CONFIGURAR ENTREGA'}</span>
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
        <div className="flex flex-col gap-2">
          {faltantes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-red-700 mb-1">Campos requeridos para programar:</p>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                {faltantes.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </ButtonBase>
          {/* {(tipoDespacho === 'Parcial' || tipoDespacho === 'Domicilio') &&
            !ocultarSet.has('omitir') && (
              <ButtonBase
                color="warning"
                size="md"
                onClick={handleOmitir}
                disabled={creandoVenta}
              >
                {creandoVenta ? 'Procesando...' : 'Omitir'}
              </ButtonBase>
            )} */}
          <ButtonBase
            color="success"
            size="md"
            onClick={handleConfirmarConFeedback}
            disabled={
              onRecolectar
                ? // Modo recolectar: solo exigimos que el domicilio sea válido
                  // (dirección/GPS). Las cantidades ya las fijó el modal padre.
                  domicilioInvalido
                : creandoVenta ||
                  ((tipoDespacho === 'EnTienda' || soloEntregarEnTienda) &&
                    resolvedMode.kind !== 'crear-venta' &&
                    totalAEntregar === 0) ||
                  (tipoDespacho === 'Parcial' && totalAEntregar === 0 && totalAProgramar === 0) ||
                  (tipoDespacho === 'Domicilio' && productosEntrega.length > 0 && totalAProgramar === 0) ||
                  domicilioInvalido ||
                  restoInvalido
            }
          >
            {creandoVenta
              ? 'Procesando...'
              : labelConfirmar
              ? labelConfirmar
              : resolvedMode.kind === 'actualizar-entrega' &&
                tipoDespacho === 'Parcial' &&
                forzarProgramarRestoOn
              ? 'Confirmar Entrega'
              : resolvedMode.kind === 'crear-entrega-resto'
              ? 'Confirmar Entrega'
              : resolvedMode.kind === 'actualizar-entrega' &&
                tipoDespachoConfirmacionOverride === 'Parcial'
              ? 'Confirmar Entrega'
              : tipoDespacho === 'EnTienda'
              ? 'Entregar Ahora'
              : tipoDespacho === 'Parcial'
              ? 'Entregar'
              : 'Programar Entrega'}
          </ButtonBase>
        </div>
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
            soloEntregar={soloEntregarEnTienda}
            readonlyEntregar={readonlyEntregarParcial}
          />
        )}
      </div>

      {/* Modal de calendario para seleccionar slot - Domicilio */}
      <ModalCalendarioSlot
        open={modalCalendarioDomicilio}
        onClose={() => setModalCalendarioDomicilio(false)}
        onAplicar={handleAplicarSlotDomicilio}
        vehiculo_id={vehiculoId}
        vehiculo={vehiculoPreseleccionadoDomicilio}
      />

      {/* Modal de calendario para seleccionar slot - Resto Parcial */}
      <ModalCalendarioSlot
        open={modalCalendarioResto}
        onClose={() => setModalCalendarioResto(false)}
        onAplicar={handleAplicarSlotResto}
        vehiculo_id={restoVehiculoId}
        vehiculo={vehiculoPreseleccionadoResto}
      />
    </Modal>
  )
}
