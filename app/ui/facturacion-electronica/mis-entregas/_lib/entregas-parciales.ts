type EntregaLike = any

type ResumenProductoParcial = {
  codigo: string
  producto: string
  marca: string
  unidad: string
  total: number
  entregado: number
  programado: number
  pendiente: number
}

export function isEntregaParcialAgrupada(entrega?: EntregaLike): boolean {
  return Boolean(entrega?.__esParcialAgrupado)
}

function ordenarEntregas(entregas: EntregaLike[]): EntregaLike[] {
  return [...entregas].sort((a, b) => {
    const fechaA = new Date(a?.created_at || 0).getTime()
    const fechaB = new Date(b?.created_at || 0).getTime()
    if (fechaA !== fechaB) return fechaA - fechaB
    return Number(a?.id || 0) - Number(b?.id || 0)
  })
}

function obtenerEstadoAgrupado(entregas: EntregaLike[]): string {
  if (entregas.some((e) => e?.estado_entrega === 'ec')) return 'ec'
  if (entregas.some((e) => e?.estado_entrega === 'pe')) return 'pe'
  if (entregas.length > 0 && entregas.every((e) => e?.estado_entrega === 'ca')) return 'ca'
  return 'en'
}

function primerValor<T>(...values: T[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

export function getEntregaOperativa(entrega?: EntregaLike): EntregaLike | undefined {
  if (!entrega) return undefined
  if (!isEntregaParcialAgrupada(entrega)) return entrega

  const hijas = ordenarEntregas(entrega.entregas_agrupadas || [])

  return (
    hijas.find((e) => e?.estado_entrega === 'ec') ||
    hijas.find((e) => e?.estado_entrega === 'pe' && e?.tipo_despacho === 'in') ||
    hijas.find((e) => e?.estado_entrega === 'pe' && e?.tipo_despacho === 'pr') ||
    hijas.find((e) => e?.estado_entrega === 'pe') ||
    hijas.find((e) => e?.estado_entrega === 'en' && e?.tipo_despacho === 'in') ||
    hijas.find((e) => e?.estado_entrega !== 'ca') ||
    hijas[0]
  )
}

export function agruparEntregasParciales(entregas: EntregaLike[]): EntregaLike[] {
  const normales: EntregaLike[] = []
  const parcialesPorGrupo = new Map<string, EntregaLike[]>()
  const ventasParciales = new Set<string>()

  for (const entrega of entregas || []) {
    if (!entrega?.venta_id) continue
    if (entrega?.tipo_entrega === 'pa' || entrega?.venta?.tipo_despacho === 'pa') {
      ventasParciales.add(entrega.venta_id)
    }
  }

  for (const entrega of entregas || []) {
    const esVentaParcial =
      Boolean(entrega?.venta_id && ventasParciales.has(entrega.venta_id)) ||
      entrega?.venta?.tipo_despacho === 'pa' ||
      entrega?.tipo_entrega === 'pa'

    if (esVentaParcial && entrega?.venta_id) {
      const claveGrupo = entrega?.grupo_entrega_id
        ? `g:${entrega.grupo_entrega_id}`
        : `v:${entrega.venta_id}`
      const actual = parcialesPorGrupo.get(claveGrupo) || []
      actual.push(entrega)
      parcialesPorGrupo.set(claveGrupo, actual)
      continue
    }
    normales.push(entrega)
  }

  const agrupadas: EntregaLike[] = []

  for (const [, hijasRaw] of parcialesPorGrupo.entries()) {
    const hijas = ordenarEntregas(hijasRaw)
    const ventaId = hijas[0]?.venta_id
    if (hijas.length <= 1) {
      agrupadas.push(hijas[0])
      continue
    }

    const entregaProgramada =
      hijas.find((e) => e?.tipo_despacho === 'pr' && e?.estado_entrega !== 'ca') ||
      hijas.find((e) => e?.tipo_despacho === 'pr')
    const entregaInmediata =
      hijas.find((e) => e?.tipo_despacho === 'in' && e?.estado_entrega === 'en') ||
      hijas.find((e) => e?.tipo_despacho === 'in')
    const entregaOperativa = getEntregaOperativa({
      __esParcialAgrupado: true,
      entregas_agrupadas: hijas,
    })
    const entregaBase = entregaOperativa || hijas[hijas.length - 1]
    const entregaConDireccion =
      hijas.find((e) => e?.direccion_entrega) || entregaProgramada || entregaBase
    const createdAtOrden = hijas[hijas.length - 1]?.created_at || entregaBase?.created_at

    agrupadas.push({
      ...entregaBase,
      id: `parcial-${ventaId}`,
      __esParcialAgrupado: true,
      venta_id: ventaId,
      estado_entrega: obtenerEstadoAgrupado(hijas),
      tipo_entrega: 'pa',
      tipo_despacho: 'pa',
      tipo_despacho_mostrar: 'Parcial',
      created_at: createdAtOrden,
      fecha_entrega: primerValor(
        entregaProgramada?.fecha_entrega,
        entregaBase?.fecha_entrega,
        hijas[0]?.fecha_entrega,
      ),
      fecha_programada: primerValor(
        entregaProgramada?.fecha_programada,
        entregaBase?.fecha_programada,
      ),
      hora_inicio: primerValor(entregaProgramada?.hora_inicio, entregaBase?.hora_inicio),
      hora_fin: primerValor(entregaProgramada?.hora_fin, entregaBase?.hora_fin),
      direccion_entrega: primerValor(
        entregaConDireccion?.direccion_entrega,
        entregaBase?.direccion_entrega,
      ),
      referencia_entrega: primerValor(
        entregaConDireccion?.referencia_entrega,
        entregaBase?.referencia_entrega,
      ),
      latitud: primerValor(entregaConDireccion?.latitud, entregaBase?.latitud),
      longitud: primerValor(entregaConDireccion?.longitud, entregaBase?.longitud),
      observaciones: primerValor(
        entregaProgramada?.observaciones,
        entregaInmediata?.observaciones,
        entregaBase?.observaciones,
      ),
      chofer_id: primerValor(entregaProgramada?.chofer_id, entregaBase?.chofer_id),
      despachador: primerValor(entregaProgramada?.despachador, entregaBase?.despachador),
      vehiculo_id: primerValor(entregaProgramada?.vehiculo_id, entregaBase?.vehiculo_id),
      vehiculo: primerValor(entregaProgramada?.vehiculo, entregaBase?.vehiculo),
      tipo_pedido: primerValor(entregaProgramada?.tipo_pedido, entregaBase?.tipo_pedido),
      cargo_destino: primerValor(
        entregaProgramada?.cargo_destino,
        entregaBase?.cargo_destino,
      ),
      productos_entregados:
        entregaProgramada?.productos_entregados ||
        entregaBase?.productos_entregados ||
        [],
      entregas_agrupadas: hijas,
    })
  }

  return [...normales, ...agrupadas].sort((a, b) => {
    const fechaA = new Date(a?.created_at || 0).getTime()
    const fechaB = new Date(b?.created_at || 0).getTime()
    if (fechaA !== fechaB) return fechaB - fechaA
    return String(b?.id || '').localeCompare(String(a?.id || ''))
  })
}

export function obtenerTramosParciales(entrega?: EntregaLike): EntregaLike[] {
  if (!entrega?.venta?.entregas_productos?.length) return entrega ? [entrega] : []

  const esParcial =
    entrega?.tipo_entrega === 'pa' || entrega?.venta?.tipo_despacho === 'pa'
  if (!esParcial) return [entrega]

  const grupoId = entrega?.grupo_entrega_id
  const ventaId = entrega?.venta_id

  return ordenarEntregas(
    entrega.venta.entregas_productos.filter((item: EntregaLike) => {
      if (grupoId && item?.grupo_entrega_id) {
        return Number(item.grupo_entrega_id) === Number(grupoId)
      }
      return item?.venta_id === ventaId && item?.tipo_entrega === 'pa'
    }),
  )
}

export function getEtiquetaTramoParcial(
  entrega?: EntregaLike,
  tramosGrupo?: EntregaLike[],
): string {
  if (!entrega || entrega?.tipo_entrega !== 'pa') return ''

  const tramos = tramosGrupo?.length ? ordenarEntregas(tramosGrupo) : obtenerTramosParciales(entrega)
  const indice = tramos.findIndex((item) => Number(item?.id) === Number(entrega?.id))
  const posicion = indice >= 0 ? indice + 1 : 1
  const total = Math.max(tramos.length, 1)

  const destino =
    entrega?.tipo_despacho === 'pr'
      ? 'Domicilio'
      : entrega?.quien_entrega === 'chofer'
      ? 'Chofer'
      : entrega?.quien_entrega === 'vendedor'
      ? 'Vendedor'
      : 'Almacen'

  return `Entrega ${posicion}/${total} - ${destino}`
}

export function listarEntregasSinAgruparParcial(entregas: EntregaLike[]): EntregaLike[] {
  const parcialesPorGrupo = new Map<string, EntregaLike[]>()

  for (const entrega of entregas || []) {
    const esParcial =
      entrega?.tipo_entrega === 'pa' || entrega?.venta?.tipo_despacho === 'pa'
    if (!esParcial || !entrega?.venta_id) continue

    const claveGrupo = entrega?.grupo_entrega_id
      ? `g:${entrega.grupo_entrega_id}`
      : `v:${entrega.venta_id}`
    const actual = parcialesPorGrupo.get(claveGrupo) || []
    actual.push(entrega)
    parcialesPorGrupo.set(claveGrupo, actual)
  }

  return [...(entregas || [])]
    .map((entrega) => {
      if (entrega?.tipo_entrega !== 'pa' && entrega?.venta?.tipo_despacho !== 'pa') {
        return entrega
      }

      const claveGrupo = entrega?.grupo_entrega_id
        ? `g:${entrega.grupo_entrega_id}`
        : `v:${entrega.venta_id}`
      const tramosGrupo = parcialesPorGrupo.get(claveGrupo) || [entrega]
      const tramosOrdenados = ordenarEntregas(tramosGrupo)
      const indiceTramo = tramosOrdenados.findIndex(
        (item) => Number(item?.id) === Number(entrega?.id),
      )
      const fechaGrupo = tramosOrdenados.reduce((max, item) => {
        const fecha = new Date(item?.created_at || 0).getTime()
        return Math.max(max, fecha)
      }, 0)

      return {
        ...entrega,
        __tramoParcialLabel: getEtiquetaTramoParcial(entrega, tramosOrdenados),
        __tramoParcialOrden: indiceTramo >= 0 ? indiceTramo + 1 : 1,
        __grupoParcialOrden: fechaGrupo,
      }
    })
    .sort((a, b) => {
      const ordenA =
        Number(a?.__grupoParcialOrden || 0) ||
        new Date(a?.created_at || 0).getTime()
      const ordenB =
        Number(b?.__grupoParcialOrden || 0) ||
        new Date(b?.created_at || 0).getTime()

      if (ordenA !== ordenB) return ordenB - ordenA

      const grupoA = Number(a?.__grupoParcialOrden || 0)
      const grupoB = Number(b?.__grupoParcialOrden || 0)
      if (grupoA && grupoB) {
        return Number(a?.__tramoParcialOrden || 1) - Number(b?.__tramoParcialOrden || 1)
      }

      return String(b?.id || '').localeCompare(String(a?.id || ''))
    })
}

export function getResumenProductosParcialAgrupado(
  entrega?: EntregaLike,
): ResumenProductoParcial[] {
  if (!isEntregaParcialAgrupada(entrega)) return []

  const mapa = new Map<string, ResumenProductoParcial>()
  const hijas = entrega.entregas_agrupadas || []

  for (const hija of hijas) {
    for (const detalle of hija?.productos_entregados || []) {
      const udv = detalle?.unidad_derivada_venta || {}
      const producto = udv?.producto_almacen_venta?.producto_almacen?.producto || {}
      const unidad = udv?.unidad_derivada_inmutable?.name || ''
      const codigo = producto?.cod_producto || ''
      const clave = `${udv?.id || codigo}|${unidad}`
      const total = Number(udv?.cantidad || 0)
      const cantidadTramo = Number(detalle?.cantidad_entregada || 0)

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          codigo,
          producto: producto?.name || 'Producto',
          marca: producto?.marca?.name || '—',
          unidad,
          total,
          entregado: 0,
          programado: 0,
          pendiente: 0,
        })
      }

      const actual = mapa.get(clave)!
      actual.total = Math.max(actual.total, total)

      if (hija?.estado_entrega === 'en') {
        actual.entregado += cantidadTramo
      } else if (hija?.estado_entrega !== 'ca' && hija?.tipo_despacho === 'pr') {
        actual.programado += cantidadTramo
      }
    }
  }

  for (const item of mapa.values()) {
    item.pendiente = Math.max(0, item.total - item.entregado - item.programado)
  }

  return [...mapa.values()]
}
