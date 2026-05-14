'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormInstance } from 'antd'
import {
  TIPOS_DIRECCION_LIST,
  TipoDireccion,
  parseDireccionesFromCliente,
  buildDireccionesPayload,
  crearDireccionVacia,
  type DireccionCliente,
  type DireccionFormValues,
  type Cliente,
  type Coordenadas,
} from '~/lib/api/cliente'

interface UseDireccionesClienteFormParams {
  form: FormInstance
  /** Cliente con `direcciones[]` cargado — undefined al crear uno nuevo. */
  cliente?: Cliente
  /**
   * Si `true`, escribe los campos legacy (`direccion_2`, `referencia_d1`,
   * `latitud_d1`, etc.) al form cada vez que cambia el state interno.
   * Pensado como "puente" para que los archivos consumidores que aún leen
   * del form esos campos sigan funcionando hasta que se migren.
   */
  writeLegacyFields?: boolean
}

/**
 * Sufijo que usan los campos legacy del form para cada tipo:
 *   D1 → '' (campo `direccion`, `referencia_d1`, `latitud_d1`, `longitud_d1`)
 *   D2 → '_2' / '_d2'
 *   D3 → '_3' / '_d3'
 *   D4 → '_4' / '_d4'
 *
 * Antes estaba duplicado en switch/case por todo el codebase.
 */
const LEGACY_FIELDS: Record<TipoDireccion, {
  direccion: string
  referencia: string
  latitud: string
  longitud: string
}> = {
  [TipoDireccion.D1]: {
    direccion: 'direccion',
    referencia: 'referencia_d1',
    latitud: 'latitud_d1',
    longitud: 'longitud_d1',
  },
  [TipoDireccion.D2]: {
    direccion: 'direccion_2',
    referencia: 'referencia_d2',
    latitud: 'latitud_d2',
    longitud: 'longitud_d2',
  },
  [TipoDireccion.D3]: {
    direccion: 'direccion_3',
    referencia: 'referencia_d3',
    latitud: 'latitud_d3',
    longitud: 'longitud_d3',
  },
  [TipoDireccion.D4]: {
    direccion: 'direccion_4',
    referencia: 'referencia_d4',
    latitud: 'latitud_d4',
    longitud: 'longitud_d4',
  },
}

/**
 * Hook canónico para manejar las direcciones de un cliente dentro de un
 * formulario. Reemplaza el patrón aplanado (`direccion`, `direccion_2`,
 * `direccion_3`, `direccion_4` + `referencia_d1..d4` + lat/lng × 4) que
 * estaba duplicado en ~18 archivos.
 *
 * El estado interno siempre es `direcciones: DireccionCliente[]` con
 * exactamente 4 entradas (una por cada `TIPOS_DIRECCION_LIST`). Si se
 * agrega `D5` al enum + a la lista, este hook lo soporta sin cambios.
 *
 * Cuando `writeLegacyFields` está activo, también escribe los nombres de
 * campo viejos al form (compatibilidad con código que aún no se migró).
 */
export function useDireccionesClienteForm({
  form,
  cliente,
  writeLegacyFields = true,
}: UseDireccionesClienteFormParams) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
  const [direcciones, setDirecciones] = useState<DireccionCliente[]>(() =>
    parseDireccionesFromCliente(cliente),
  )
  const [tipoActivo, setTipoActivo] = useState<TipoDireccion>(TipoDireccion.D1)
  /**
   * Texto humano del reverse-geocoding (Mapbox) para cada dirección. No
   * vive en el modelo del backend, solo se muestra como hint en la UI.
   */
  const [direccionesMapa, setDireccionesMapa] = useState<
    Record<TipoDireccion, string>
  >({
    [TipoDireccion.D1]: '',
    [TipoDireccion.D2]: '',
    [TipoDireccion.D3]: '',
    [TipoDireccion.D4]: '',
  })

  // Cuando el cliente cambia (al abrir el modal en modo editar), re-parsear.
  useEffect(() => {
    setDirecciones(parseDireccionesFromCliente(cliente))
  }, [cliente])

  useEffect(() => {
    let cancelled = false

    const cargarDireccionesMapa = async () => {
      if (!mapboxToken) return

      const pendientes = direcciones.filter((d) =>
        d.latitud != null &&
        d.longitud != null &&
        !direccionesMapa[d.tipo],
      )

      if (!pendientes.length) return

      await Promise.all(
        pendientes.map(async (d) => {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${d.longitud},${d.latitud}.json?access_token=${mapboxToken}&limit=1&language=es`
            )
            const data = await response.json()
            const placeName = data.features?.[0]?.place_name
            if (cancelled || !placeName) return
            setDireccionesMapa((prev) => {
              if (prev[d.tipo]) return prev
              return { ...prev, [d.tipo]: placeName }
            })
          } catch {
            if (cancelled) return
            setDireccionesMapa((prev) => {
              if (prev[d.tipo]) return prev
              return {
                ...prev,
                [d.tipo]: `${Number(d.latitud).toFixed(6)}, ${Number(d.longitud).toFixed(6)}`,
              }
            })
          }
        }),
      )
    }

    cargarDireccionesMapa()

    return () => {
      cancelled = true
    }
  }, [direcciones, direccionesMapa, mapboxToken])

  // Escribir todos los slots al form como campos legacy. Se ejecuta cada
  // vez que cambia el state interno — así los archivos consumidores que
  // siguen leyendo `direccion_2`, `latitud_d1`, etc. ven los datos al día.
  useEffect(() => {
    if (!writeLegacyFields) return
    direcciones.forEach((d) => {
      const fields = LEGACY_FIELDS[d.tipo]
      form.setFieldValue(fields.direccion, d.direccion || '')
      form.setFieldValue(fields.referencia, d.referencia || '')
      form.setFieldValue(fields.latitud, d.latitud ?? undefined)
      form.setFieldValue(fields.longitud, d.longitud ?? undefined)
    })
  }, [direcciones, writeLegacyFields, form])

  const direccionActiva = useMemo(
    () =>
      direcciones.find((d) => d.tipo === tipoActivo) ??
      crearDireccionVacia(tipoActivo),
    [direcciones, tipoActivo],
  )

  /**
   * Aplica un parche a la dirección del tipo dado. Si el slot no existe,
   * lo crea (no debería pasar porque `parseDireccionesFromCliente` siempre
   * devuelve las 4, pero por seguridad).
   */
  const actualizarDireccion = useCallback(
    (tipo: TipoDireccion, parche: Partial<DireccionCliente>) => {
      setDirecciones((prev) => {
        const idx = prev.findIndex((d) => d.tipo === tipo)
        if (idx < 0) return [...prev, { ...crearDireccionVacia(tipo), ...parche }]
        const next = [...prev]
        next[idx] = { ...next[idx], ...parche }
        return next
      })
    },
    [],
  )

  /** Setea coordenadas + (opcional) dirección humana de Mapbox. */
  const actualizarCoordenadas = useCallback(
    (tipo: TipoDireccion, coords: Coordenadas, direccionMapa?: string) => {
      actualizarDireccion(tipo, { latitud: coords.lat, longitud: coords.lng })
      if (direccionMapa !== undefined) {
        setDireccionesMapa((prev) => ({ ...prev, [tipo]: direccionMapa }))
      }
    },
    [actualizarDireccion],
  )

  /**
   * Cambia la dirección "activa" del cliente — cuando un consumidor (ej:
   * crear-venta) tiene un selector D1/D2/D3/D4, esto sincroniza:
   *  - el state interno (`tipoActivo`)
   *  - el campo legacy `direccion_seleccionada`
   *  - los aliases `direccion`, `direccion_entrega`, `punto_llegada` que
   *    consume el resto del form.
   */
  const cambiarSeleccion = useCallback(
    (tipo: TipoDireccion) => {
      setTipoActivo(tipo)
      const direccion =
        direcciones.find((d) => d.tipo === tipo)?.direccion ?? ''
      form.setFieldValue('direccion_seleccionada', tipo)
      form.setFieldValue('direccion', direccion)
      form.setFieldValue('direccion_entrega', direccion)
      form.setFieldValue('punto_llegada', direccion)
    },
    [direcciones, form],
  )

  /**
   * Devuelve el array listo para los endpoints `crearDireccion` /
   * `actualizarDireccion` del backend. Filtra las vacías.
   */
  const payloadParaApi = useCallback(
    (): Array<DireccionFormValues & { tipo: TipoDireccion }> =>
      buildDireccionesPayload(direcciones),
    [direcciones],
  )

  /** Helper de lectura — coordenadas del tipo dado, null si no tiene. */
  const getCoordenadas = useCallback(
    (tipo: TipoDireccion): Coordenadas | null => {
      const d = direcciones.find((x) => x.tipo === tipo)
      if (!d || d.latitud == null || d.longitud == null) return null
      return { lat: Number(d.latitud), lng: Number(d.longitud) }
    },
    [direcciones],
  )

  return {
    /** Lista de tipos en orden — para iterar (tabs, radios, etc). */
    tipos: TIPOS_DIRECCION_LIST,
    /** Array de 4 direcciones (incluye vacías). */
    direcciones,
    /** Tipo actualmente activo (D1 por defecto). */
    tipoActivo,
    /** Cambia la tab/seleccion sin tocar el form (usar `cambiarSeleccion` para sync). */
    setTipoActivo,
    /** Dirección actualmente activa (siempre devuelve una, vacía si no existe). */
    direccionActiva,
    /** Texto del reverse-geocoding por tipo. */
    direccionesMapa,
    /** Patch sobre una dirección concreta. */
    actualizarDireccion,
    /** Set coords + opcional reverse-geocoding label. */
    actualizarCoordenadas,
    /** Cambia tipoActivo + sincroniza form aliases (direccion, direccion_entrega, …). */
    cambiarSeleccion,
    /** Coordenadas del tipo dado (o null). */
    getCoordenadas,
    /** Payload listo para enviar al backend. */
    payloadParaApi,
  }
}
