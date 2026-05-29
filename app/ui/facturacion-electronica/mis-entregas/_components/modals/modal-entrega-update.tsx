'use client'

import { useEffect, useMemo, useState } from 'react'
import { Form, Modal, Spin } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { FaExchangeAlt, FaFilePdf, FaMapMarkedAlt } from 'react-icons/fa'
import dayjs from 'dayjs'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregaProductoApi, TipoEntrega } from '~/lib/api/entrega-producto'
import { clienteApi } from '~/lib/api/cliente'
import ModalDetallesEntrega from '../../../mis-ventas/crear-venta/_components/modals/modal-detalles-entrega'
import ModalSeleccionarTipoDespacho from '../../../mis-ventas/crear-venta/_components/modals/modal-seleccionar-tipo-despacho'
import type {
  SeccionOcultable,
  TipoDespachoUI,
} from '../../../mis-ventas/crear-venta/_components/modals/detalles-entrega/types'
import type { ProductoEntrega } from '../../../mis-ventas/_hooks/use-productos-entrega'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import ButtonBase from '~/components/buttons/button-base'
import { getEntregaOperativa } from '../../_lib/entregas-parciales'

const normalizarClaveProducto = (codigo: string, unidad: string) =>
  `${codigo}`.trim().toLowerCase() + '|' + `${unidad}`.trim().toLowerCase()

// Modal "Mapa de Entrega" cargado dinámicamente — incluye Mapbox con
// geolocalización del usuario + dirección del cliente + navegación
// (Google Maps / Waze). Se abre desde el botón en el header.
const ModalMapaEntrega = dynamic(
  () => import('./mapbox/modal-mapa-entrega'),
  { ssr: false },
)


interface ModalEntregaUpdateProps {
  open: boolean
  setOpen: (open: boolean) => void
  entrega?: any
  onSuccess?: () => void
  /**
   * Si la entrega ya está cerrada como `'en'` pero quedaron productos con
   * `cantidad_pendiente > 0`, el modal entra en modo "Entregar Restante":
   * en lugar de actualizar la entrega origen, abre el mismo
   * `<ModalDetallesEntrega>` para CREAR una nueva entrega que cubra los
   * productos pendientes. El usuario decide tipo (EnTienda/Domicilio/Parcial)
   * y cantidades igual que al crear la venta.
   */
  restante?: boolean
  /** Ocultar la tabla de productos (ya configurada en un paso anterior). */
  ocultarTablaProductos?: boolean
  /** Sobrescribe el título del modal (default: "CONFIGURAR ENTREGA"). */
  titulo?: string
  /** Sobrescribe el label del botón principal de confirmación. */
  labelConfirmar?: string
  /**
   * Modo "solo recolectar": el modal no crea la entrega, solo devuelve los
   * datos de despacho (dirección, GPS, fecha, chofer) al padre. Ver
   * `ModalDetallesEntrega.onRecolectar`.
   */
  onRecolectar?: (config: import('../../../mis-ventas/crear-venta/_components/modals/detalles-entrega/types').RecolectarEntregaConfig) => void
}

/**
 * Wrapper sobre `<ModalDetallesEntrega>` para uso desde `mis-entregas`.
 *
 * Soporta dos modos según `restante`:
 *   - `false` (default): actualiza la entrega existente (mode `actualizar-entrega`).
 *   - `true`: crea una nueva entrega con los pendientes (mode `crear-entrega-resto`).
 *
 * Para todos los tipos se reusa la UI de "Parcial" o "Domicilio" según
 * corresponda. El selector de "quién entrega" se oculta porque ya se decidió
 * al crear la venta.
 */
export default function ModalEntregaUpdate({
  open,
  setOpen,
  entrega,
  onSuccess,
  restante = false,
  ocultarTablaProductos = false,
  titulo,
  labelConfirmar,
  onRecolectar,
}: ModalEntregaUpdateProps) {
  const [form] = Form.useForm()
  const { message } = useApp()
  const queryClient = useQueryClient()
  const [modalSeleccionarTipoOpen, setModalSeleccionarTipoOpen] = useState(false)
  const [modalMapaEntregaOpen, setModalMapaEntregaOpen] = useState(false)
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)

  const entregaOperativa = useMemo(
    () => getEntregaOperativa(entrega) || entrega,
    [entrega],
  )
  const entregaIdDetalle = Number(
    (entrega as any)?.__esParcialAgrupado
      ? (entregaOperativa as any)?.id
      : entrega?.id,
  )

  // NOTE: old `entregaProductoApi.getById` is disabled — the new delivery
  // system serves full data via `entregasNuevasApi.listar`, so the entrega
  // prop already has everything needed. Querying the old endpoint with new
  // `entrega` table IDs would cause `EntregaProducto::findOrFail` 404s.
  const { data: entregaDetalleResp } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'detalle-restante', entregaIdDetalle],
    queryFn: () => entregaProductoApi.getById(entregaIdDetalle),
    enabled: false,
    staleTime: 0,
  })
  const entregaDetalle = (entregaDetalleResp?.data?.data ?? entregaDetalleResp?.data) as any
  const entregaFuente = useMemo(() => {
    if (!entregaDetalle) return entrega
    if (!(entrega as any)?.__esParcialAgrupado) return entregaDetalle

    return {
      ...entregaDetalle,
      ...entrega,
      id: entregaDetalle?.id ?? entrega?.id,
      grupo_entrega_id: entregaDetalle?.grupo_entrega_id ?? entrega?.grupo_entrega_id,
      tipo_despacho: entregaDetalle?.tipo_despacho ?? entrega?.tipo_despacho,
      estado_entrega: entregaDetalle?.estado_entrega ?? entrega?.estado_entrega,
      quien_entrega: entregaDetalle?.quien_entrega ?? entrega?.quien_entrega,
      almacen_salida_id:
        entregaDetalle?.almacen_salida_id ?? entrega?.almacen_salida_id,
      user_id: entregaDetalle?.user_id ?? entrega?.user_id,
      venta: {
        ...(entregaDetalle?.venta || {}),
        ...(entrega?.venta || {}),
        entregas_productos:
          entregaDetalle?.venta?.entregas_productos ||
          entrega?.venta?.entregas_productos ||
          [],
      },
      productos_entregados:
        entrega?.productos_entregados?.length > 0
          ? entrega.productos_entregados
          : entregaDetalle?.productos_entregados || [],
      entregas_agrupadas:
        entrega?.entregas_agrupadas || entregaDetalle?.entregas_agrupadas || [],
      chofer_id: entrega?.chofer_id ?? entregaDetalle?.chofer_id,
      despachador: entrega?.despachador ?? entregaDetalle?.despachador,
      vehiculo_id: entrega?.vehiculo_id ?? entregaDetalle?.vehiculo_id,
      vehiculo: entrega?.vehiculo ?? entregaDetalle?.vehiculo,
      fecha_programada: entrega?.fecha_programada ?? entregaDetalle?.fecha_programada,
      hora_inicio: entrega?.hora_inicio ?? entregaDetalle?.hora_inicio,
      hora_fin: entrega?.hora_fin ?? entregaDetalle?.hora_fin,
      direccion_entrega: entrega?.direccion_entrega ?? entregaDetalle?.direccion_entrega,
      referencia_entrega: entrega?.referencia_entrega ?? entregaDetalle?.referencia_entrega,
      latitud: entrega?.latitud ?? entregaDetalle?.latitud,
      longitud: entrega?.longitud ?? entregaDetalle?.longitud,
      observaciones: entrega?.observaciones ?? entregaDetalle?.observaciones,
      tipo_pedido: entrega?.tipo_pedido ?? entregaDetalle?.tipo_pedido,
      cargo_destino: entrega?.cargo_destino ?? entregaDetalle?.cargo_destino,
    }
  }, [entrega, entregaDetalle])
  const entregaProgramadaGrupo = useMemo(() => {
    const esParcialAgrupado = Boolean((entrega as any)?.__esParcialAgrupado)
    const esParcial =
      esParcialAgrupado ||
      entregaFuente?.tipo_entrega === 'pa' ||
      entregaFuente?.venta?.tipo_despacho === 'pa'
    if (!esParcial) return undefined

    const grupoId =
      entregaFuente?.grupo_entrega_id ??
      entregaDetalle?.grupo_entrega_id ??
      (entrega as any)?.grupo_entrega_id
    const entregaActualId = Number(entregaFuente?.id ?? entregaDetalle?.id ?? entrega?.id)
    const entregasRelacionadas = Array.isArray(entregaFuente?.venta?.entregas_productos)
      ? entregaFuente.venta.entregas_productos
      : Array.isArray(entregaDetalle?.venta?.entregas_productos)
      ? entregaDetalle.venta.entregas_productos
      : []

    const candidatas = entregasRelacionadas.filter((item: any) => {
      if (Number(item?.id) === entregaActualId) return false
      if (grupoId && Number(item?.grupo_entrega_id) !== Number(grupoId)) return false
      return item?.tipo_despacho === 'pr'
    })

    return (
      candidatas.find((item: any) => item?.estado_entrega === 'pe') ||
      candidatas.find((item: any) => item?.estado_entrega === 'ec') ||
      candidatas[0]
    )
  }, [entrega, entregaDetalle, entregaFuente])
  const requiereHidratacionCompletaParcial = Boolean(
    open &&
      entregaIdDetalle &&
      !entregaDetalle &&
      (entrega?.tipo_entrega === 'pa' ||
        entrega?.venta?.tipo_despacho === 'pa' ||
        entrega?.__esParcialAgrupado),
  )

  // Tipo "UI" actualmente activo. En modo update, se inicializa con el tipo
  // real de la entrega y se persiste en el backend al cambiarlo. En modo
  // restante (la entrega origen ya está cerrada), solo se cambia local —
  // el restante puede tener un tipo distinto al de la entrega origen.
  const tipoInicialUI: TipoDespachoUI = useMemo(() => {
    const t = entregaFuente?.tipo_entrega as 'rt' | 'de' | 'pa' | undefined
    if (t === 'de') return 'Domicilio'
    if (t === 'rt') return 'EnTienda'
    if (t === 'pa' && entregaFuente?.tipo_despacho === 'pr') return 'Domicilio'
    return 'Parcial'
  }, [entregaFuente?.tipo_despacho, entregaFuente?.tipo_entrega])
  const direccionSeleccionadaVenta =
    entregaFuente?.venta?.direccion_seleccionada || 'D1'
  const [tipoLocal, setTipoLocal] = useState<TipoDespachoUI>(tipoInicialUI)
  // Re-sincronizar solo cuando cambia el tipo real de la entrega (valor primitivo).
  // Antes dependía de `tipoInicialUI` que a su vez dependía del objeto `entrega`
  // completo — cada refetch traía una nueva referencia y disparaba setTipoLocal
  // innecesariamente, causando un re-render que cerraba el modal.
  useEffect(() => {
    setTipoLocal(tipoInicialUI)
  }, [tipoInicialUI])

  const handleSelectTipoDespacho = async (
    tipo: 'EnTienda' | 'Domicilio' | 'Parcial',
  ) => {
    if (!entrega) return

    // En modo restante NO tocamos el backend — la entrega origen quedó
    // cerrada con su `tipo_entrega` original. Solo cambiamos la UI local
    // para que el usuario elija cómo entregar el restante.
    if (restante) {
      setTipoLocal(tipo)
      setModalSeleccionarTipoOpen(false)
      return
    }

    const nuevoTipo: TipoEntrega =
      tipo === 'EnTienda'
        ? TipoEntrega.RECOJO_EN_TIENDA
        : tipo === 'Domicilio'
        ? TipoEntrega.DESPACHO
        : TipoEntrega.PARCIAL

    if (tipo === tipoLocal) {
      message.info('La entrega ya es de ese tipo')
      return
    }

    try {
      const response = await entregaProductoApi.update(
        Number(entregaOperativa?.id || entregaFuente?.id),
        {
        tipo_entrega: nuevoTipo,
        },
      )
      if (response.error) {
        message.error(response.error.message || 'Error al cambiar tipo de entrega')
        return
      }
      const labelNuevo =
        tipo === 'EnTienda'
          ? 'Recojo en Tienda'
          : tipo === 'Domicilio'
          ? 'Despacho a Domicilio'
          : 'Despacho Parcial'
      message.success(`Tipo de entrega cambiado a ${labelNuevo}`)
      setTipoLocal(tipo)
      setModalSeleccionarTipoOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      // No llamar onSuccess aquí — el modal sigue abierto y el usuario
      // continúa configurando la entrega. El refetch ya actualiza la tabla.
    } catch (err: any) {
      message.error(err?.message || 'Error al cambiar tipo de entrega')
    }
  }

  // Direcciones del cliente — se declara aquí (antes de los efectos) para
  // poder usarlo como dep en el primer useEffect sin TDZ.
  const clienteIdDirecciones =
    entregaFuente?.venta?.cliente_id ?? entregaFuente?.venta?.cliente?.id
  const { data: direccionesResp } = useQuery({
    queryKey: [QueryKeys.DIRECCIONES_CLIENTE, clienteIdDirecciones],
    queryFn: () => clienteApi.listarDirecciones(clienteIdDirecciones!),
    enabled: !!clienteIdDirecciones && open,
  })
  const direccionesCliente = useMemo(
    () => (direccionesResp?.data?.data as any[]) || [],
    [direccionesResp],
  )

  // Pre-llenar el form con los valores actuales de la entrega cuando se
  // abre el modal o cambia la entrega seleccionada.
  // En modo restante NO pre-llenamos los datos de despacho del origen
  // (dirección, fecha, chofer): el restante es una entrega nueva y el
  // usuario decide esos datos desde cero.
  //
  // IMPORTANTE: la dep es `entrega?.id`, NO `entrega`. Si se usa el objeto
  // entero, React Query re-emite una nueva referencia en cada refetch y
  // el `resetFields()` se dispara repetidamente — borra los campos
  // `_resto_*` que ya pobló el modal de detalles (referencia, lat/lng, etc).
  useEffect(() => {
    if (!open || !entregaFuente) return
    if (restante) {
      // En restante heredamos los datos de despacho de la entrega origen
      // (chofer, vehículo, fecha/hora, tipo_pedido) — la nueva entrega
      // normalmente va al mismo destinatario con los mismos recursos. El
      // usuario puede modificar cualquiera antes de confirmar. Se setean
      // tanto los campos sin prefijo (Domicilio puro) como los `_resto_*`
      // (Parcial + programar resto) para que cualquier tipo elegido tenga
      // los datos pre-cargados.
      form.resetFields()
      const heredados: Record<string, any> = {
        direccion_seleccionada: direccionSeleccionadaVenta,
      }
      if (entregaFuente.tipo_pedido) {
        heredados.tipo_pedido = entregaFuente.tipo_pedido
        heredados._resto_tipo_pedido = entregaFuente.tipo_pedido
      }
      if (entregaFuente.cargo_destino) {
        heredados.cargo_destino = entregaFuente.cargo_destino
        heredados._resto_cargo_destino = entregaFuente.cargo_destino
      }
      // Heredar despachador, vehículo y fecha/hora de la entrega origen.
      // El comentario del useEffect decía que se heredaban, pero el código
      // nunca los seteaba — por eso salían vacíos en el modal restante.
      if (entregaFuente.chofer_id) {
        heredados.despachador_id = entregaFuente.chofer_id
        heredados._resto_despachador_id = entregaFuente.chofer_id
      }
      if (entregaFuente.vehiculo_id) {
        heredados.vehiculo_id = entregaFuente.vehiculo_id
        heredados._resto_vehiculo_id = entregaFuente.vehiculo_id
      }
      if (entregaFuente.fecha_programada) {
        const fechaFmt = dayjs(entregaFuente.fecha_programada).format('YYYY-MM-DD')
        heredados.fecha_programada = fechaFmt
        heredados._resto_fecha_programada = fechaFmt
      }
      if (entregaFuente.hora_inicio) {
        heredados.hora_inicio = entregaFuente.hora_inicio
        heredados._resto_hora_inicio = entregaFuente.hora_inicio
      }
      if (entregaFuente.hora_fin) {
        heredados.hora_fin = entregaFuente.hora_fin
        heredados._resto_hora_fin = entregaFuente.hora_fin
      }
      // Si las direcciones del cliente ya cargaron, rellenar aquí mismo para
      // sobrevivir al re-run de este efecto cuando show() llega y cambia
      // entregaFuente (el resetFields() borraría lo que llenó Effect 2).
      // Se setean AMBAS variantes: sin prefijo (Domicilio puro) y _resto_*
      // (Parcial / programar-resto) para cubrir cualquier tipo elegido.
      if (direccionesCliente.length > 0) {
        const tipo = (direccionSeleccionadaVenta || 'D1') as string
        const dir = direccionesCliente.find((d: any) => d.tipo === tipo) ?? direccionesCliente[0]
        if (dir) {
          heredados.direccion_entrega = dir.direccion || ''
          heredados.referencia_entrega = dir.referencia || ''
          heredados._resto_direccion_entrega = dir.direccion || ''
          heredados._resto_referencia_entrega = dir.referencia || ''
          if (dir.latitud != null && dir.longitud != null) {
            heredados.latitud = Number(dir.latitud)
            heredados.longitud = Number(dir.longitud)
            heredados._resto_latitud = Number(dir.latitud)
            heredados._resto_longitud = Number(dir.longitud)
          }
        }
      } else {
        // Fallback inmediato: la fakeEntrega ya trae la D1 pre-populada desde
        // ventaDetalle.cliente.direcciones para no depender de la query async.
        if (entregaFuente.direccion_entrega) {
          heredados.direccion_entrega = entregaFuente.direccion_entrega
          heredados._resto_direccion_entrega = entregaFuente.direccion_entrega
        }
        if (entregaFuente.referencia_entrega) {
          heredados.referencia_entrega = entregaFuente.referencia_entrega
          heredados._resto_referencia_entrega = entregaFuente.referencia_entrega
        }
        if (entregaFuente.latitud != null && entregaFuente.longitud != null) {
          heredados.latitud = Number(entregaFuente.latitud)
          heredados.longitud = Number(entregaFuente.longitud)
          heredados._resto_latitud = Number(entregaFuente.latitud)
          heredados._resto_longitud = Number(entregaFuente.longitud)
        }
      }
      form.setFieldsValue(heredados)
      return
    }
    const fuenteProgramada = entregaProgramadaGrupo || entregaFuente
    form.setFieldsValue({
      quien_entrega: entregaFuente.quien_entrega || 'almacen',
      observaciones: entregaFuente.observaciones || '',
      despachador_id: entregaFuente.chofer_id || undefined,
      _resto_despachador_id: fuenteProgramada?.chofer_id || undefined,
      tipo_pedido: entregaFuente.tipo_pedido || 'interno',
      _resto_tipo_pedido: fuenteProgramada?.tipo_pedido || entregaFuente.tipo_pedido || 'interno',
      cargo_destino: entregaFuente.cargo_destino || undefined,
      _resto_cargo_destino: fuenteProgramada?.cargo_destino || entregaFuente.cargo_destino || undefined,
      fecha_programada: entregaFuente.fecha_programada
        ? dayjs(entregaFuente.fecha_programada).format('YYYY-MM-DD')
        : undefined,
      _resto_fecha_programada: fuenteProgramada?.fecha_programada
        ? dayjs(fuenteProgramada.fecha_programada).format('YYYY-MM-DD')
        : undefined,
      hora_inicio: entregaFuente.hora_inicio || undefined,
      hora_fin: entregaFuente.hora_fin || undefined,
      _resto_hora_inicio: fuenteProgramada?.hora_inicio || undefined,
      _resto_hora_fin: fuenteProgramada?.hora_fin || undefined,
      // Omit address keys entirely when empty so Ant Design's setFieldsValue
      // does not override Effect 2's client-address auto-fill when show() loads.
      ...(entregaFuente.direccion_entrega
        ? { direccion_entrega: entregaFuente.direccion_entrega }
        : {}),
      ...(entregaFuente.referencia_entrega
        ? { referencia_entrega: entregaFuente.referencia_entrega }
        : {}),
      ...((fuenteProgramada?.direccion_entrega || entregaFuente.direccion_entrega)
        ? { _resto_direccion_entrega: fuenteProgramada?.direccion_entrega || entregaFuente.direccion_entrega }
        : {}),
      ...((fuenteProgramada?.referencia_entrega || entregaFuente.referencia_entrega)
        ? { _resto_referencia_entrega: fuenteProgramada?.referencia_entrega || entregaFuente.referencia_entrega }
        : {}),
      latitud:
        entregaFuente.latitud != null ? Number(entregaFuente.latitud) : undefined,
      longitud:
        entregaFuente.longitud != null ? Number(entregaFuente.longitud) : undefined,
      _resto_latitud:
        fuenteProgramada?.latitud != null ? Number(fuenteProgramada.latitud) : undefined,
      _resto_longitud:
        fuenteProgramada?.longitud != null ? Number(fuenteProgramada.longitud) : undefined,
      vehiculo_id: entregaFuente.vehiculo_id || undefined,
      _resto_vehiculo_id: fuenteProgramada?.vehiculo_id || undefined,
      direccion_seleccionada: direccionSeleccionadaVenta,
    })
  }, [open, entregaFuente, entregaProgramadaGrupo, restante, form, direccionSeleccionadaVenta, direccionesCliente])

  // Pre-cargar campos `_resto_*` con la dirección del cliente en modo restante.
  //
  // El `<ModalDetallesEntrega>` interno también tiene un useEffect que hace
  // esto, pero depende del switch `programarResto` y de timing. Acá lo
  // hacemos en cuanto llegan las direcciones, antes de que el usuario active
  // el switch — los inputs `_resto_*` recién aparecen al activarlo, así que
  // cuando el componente TextareaBase se monta lee el valor ya seteado en
  // el form. Resuelve el bug donde la "Referencia" salía vacía.
  useEffect(() => {
    if (!open || !restante || direccionesCliente.length === 0) return
    const tipo = (form.getFieldValue('direccion_seleccionada') ||
      direccionSeleccionadaVenta ||
      'D1') as string
    const dir = direccionesCliente.find((d: any) => d.tipo === tipo) ||
      direccionesCliente[0]
    if (!dir) return
    form.setFieldValue('_resto_direccion_entrega', dir.direccion || '')
    form.setFieldValue('_resto_referencia_entrega', dir.referencia || '')
    if (dir.latitud != null && dir.longitud != null) {
      form.setFieldValue('_resto_latitud', Number(dir.latitud))
      form.setFieldValue('_resto_longitud', Number(dir.longitud))
    }
  }, [open, restante, direccionesCliente, entregaFuente?.id, form, direccionSeleccionadaVenta])

  useEffect(() => {
    if (!open || restante || direccionesCliente.length === 0) return
    const yaTieneDireccion = !!form.getFieldValue('direccion_entrega')
    const yaTieneReferencia = form.getFieldValue('referencia_entrega') != null
      && form.getFieldValue('referencia_entrega') !== ''
    const yaTieneCoords = form.getFieldValue('latitud') != null && form.getFieldValue('longitud') != null

    if (yaTieneDireccion && yaTieneReferencia && yaTieneCoords) return

    const tipo = (form.getFieldValue('direccion_seleccionada') ||
      direccionSeleccionadaVenta ||
      'D1') as string
    const dir = direccionesCliente.find((d: any) => d.tipo === tipo) || direccionesCliente[0]
    if (!dir) return

    if (!yaTieneDireccion) {
      form.setFieldValue('direccion_entrega', dir.direccion || '')
    }
    if (!yaTieneReferencia) {
      form.setFieldValue('referencia_entrega', dir.referencia || '')
    }
    if (!yaTieneCoords && dir.latitud != null && dir.longitud != null) {
      form.setFieldValue('latitud', Number(dir.latitud))
      form.setFieldValue('longitud', Number(dir.longitud))
    }
  }, [open, restante, direccionesCliente, entregaFuente?.id, form, direccionSeleccionadaVenta])

  // Productos pre-cargados desde la entrega para llenar la tabla.
  // Shape del backend (snake_case):
  //   productos_entregados[].unidad_derivada_venta
  //     .producto_almacen_venta.producto_almacen.producto.name
  //
  // Reglas según el modo:
  //   - restante=true: solo incluir productos con `cantidad_pendiente > 0`
  //     (los que faltan por entregar). `total = pendiente`, `entregado = 0`,
  //     `entregar = pendiente` (sugerencia: entregar todo lo que queda).
  //   - restante=false:
  //       * si la entrega ya está 'en': mostrar todo entregado / lo que queda.
  //       * si la entrega está 'pe'/'ec': usar la cantidad PROGRAMADA en esta
  //         entrega (`detalle.cantidad_entregada`) como base de `entregar`,
  //         no el total de la venta.
  const productosIniciales: ProductoEntrega[] = useMemo(() => {
    if (!entregaFuente?.productos_entregados) return []
    const esRecojoTiendaAlmacenPendiente =
      entregaFuente?.tipo_entrega === 'rt' &&
      entregaFuente?.tipo_despacho === 'in' &&
      entregaFuente?.estado_entrega !== 'en' &&
      entregaFuente?.quien_entrega === 'almacen'

    const entregaFueEntregadaAntes = Boolean(
      (entregaFuente as any)?.user_entregado_id ||
      (entregaFuente as any)?.userEntregado?.id,
    )
    const entregaTieneEntregaFisica =
      entregaFuente?.estado_entrega === 'en' || entregaFueEntregadaAntes
    const ultimaEdicion = entregaFueEntregadaAntes
      ? (entregaFuente.venta as any)?.historial?.find?.((h: any) => h.accion === 'edicion')
      : undefined

    const productosAnteriores = new Map<string, {
      cantidad: number
      producto: string
      unidad: string
    }>()
    for (const producto of ultimaEdicion?.datos_anteriores?.productos || []) {
      for (const unidad of producto?.unidades || []) {
        const clave = `${producto?.codigo || ''}|${unidad?.unidad || ''}`.trim().toLowerCase()
        productosAnteriores.set(
          clave,
          {
            cantidad: Number(productosAnteriores.get(clave)?.cantidad || 0) + Number(unidad?.cantidad ?? 0),
            producto: producto?.nombre || '—',
            unidad: unidad?.unidad || '',
          },
        )
      }
    }

    if (restante) {
      // Modelo N-hijas (Opción A): el pendiente real lo tiene UDV.cantidad_pendiente.
      // El backend decrementa este valor al crear cada hija (store()), por lo que
      // siempre refleja lo que aún no está asignado a ningún despacho.
      return entregaFuente.productos_entregados
        .map((p: any, index: number) => {
          const ud = p.unidad_derivada_venta || {}
          const pav = ud.producto_almacen_venta || {}
          const prod = pav.producto_almacen?.producto || {}
          const totalLinea = Number(ud.cantidad ?? 0)
          const udvId = Number(ud.id ?? p.unidad_derivada_venta_id)
          const pendiente = Number(ud.cantidad_pendiente ?? 0)
          if (pendiente <= 0) return null

          return {
            id: index + 1,
            producto: prod.name || p.producto_name || '',
            ubicacion: '',
            total: totalLinea,
            recibido: 0,
            entregado: Math.max(0, totalLinea - pendiente),
            programado: 0,
            pendiente,
            entregar: pendiente,
            entregar_programado: 0,
            unidad_derivada_venta_id: udvId,
            detalle_entrega_producto_id: Number(p?.id || 0) || undefined,
          }
        })
        .filter(Boolean) as ProductoEntrega[]
    }

    const productos = entregaFuente.productos_entregados.map((p: any, index: number) => {
      const ud = p.unidad_derivada_venta || {}
      const pav = ud.producto_almacen_venta || {}
      const pa = pav.producto_almacen || {}
      const prod = pa.producto || {}
      const totalVenta = Number(ud.cantidad ?? 0)
      const cantidadProgramadaEstaEntrega = Number(p.cantidad_entregada ?? 0)
      const udvId = Number(ud.id ?? p.unidad_derivada_venta_id)
      const grupoEntregaId = entregaFuente?.grupo_entrega_id || entregaFuente?.id
      const entregasRelacionadas = Array.isArray(entregaFuente?.venta?.entregas_productos)
        ? entregaFuente.venta.entregas_productos
        : []
      const esParcialAgrupado = entregaFuente?.tipo_entrega === 'pa' && entregasRelacionadas.length > 0
      const codigo = prod.cod_producto || ''
      const unidad = ud.unidad_derivada_inmutable?.name || ''
      const clave = normalizarClaveProducto(codigo, unidad)
      const cantidadAnterior = Number(productosAnteriores.get(clave)?.cantidad || 0)
      const pendienteRaw = ud.cantidad_pendiente
      const pendienteVentaReal = pendienteRaw == null
        ? Math.max(0, totalVenta - cantidadProgramadaEstaEntrega)
        : Number(pendienteRaw)
      const hijasGrupo = esParcialAgrupado
        ? entregasRelacionadas.filter((hija: any) => {
            if ((hija?.grupo_entrega_id || null) && grupoEntregaId) {
              return Number(hija.grupo_entrega_id) === Number(grupoEntregaId)
            }
            return hija?.tipo_entrega === 'pa'
          })
        : []
      const entregadoGrupo = hijasGrupo.reduce((acc: number, hija: any) => {
        if (hija?.estado_entrega !== 'en') return acc
        const detalle = (hija?.productos_entregados || []).find((d: any) => {
          return Number(d?.unidad_derivada_venta_id) === udvId
        })
        return acc + Number(detalle?.cantidad_entregada || 0)
      }, 0)
      const programadoOtros = hijasGrupo.reduce((acc: number, hija: any) => {
        const esProgramadoPendiente =
          hija?.estado_entrega !== 'en' &&
          hija?.estado_entrega !== 'ca' &&
          Number(hija?.id) !== Number(entregaFuente?.id)
        if (!esProgramadoPendiente) return acc
        const detalle = (hija?.productos_entregados || []).find((d: any) => {
          return Number(d?.unidad_derivada_venta_id) === udvId
        })
        return acc + Number(detalle?.cantidad_entregada || 0)
      }, 0)
      const entregadoReal = entregaTieneEntregaFisica
        ? cantidadProgramadaEstaEntrega
        : 0
      const recibidoReal = entregaFueEntregadaAntes
        ? Math.max(cantidadAnterior - totalVenta, 0)
        : 0

      if (!entregaTieneEntregaFisica) {
        if (esRecojoTiendaAlmacenPendiente) {
          return {
            id: index + 1,
            producto: prod.name || p.producto_name || '',
            ubicacion: '',
            total: totalVenta,
            recibido: recibidoReal,
            entregado: 0,
            pendiente: pendienteVentaReal,
            entregar: pendienteVentaReal,
            entregar_programado: 0,
            unidad_derivada_venta_id: udvId,
            detalle_entrega_producto_id: Number(p?.id || 0) || undefined,
          }
        }
        const pendienteEstaEntrega = cantidadProgramadaEstaEntrega > 0
          ? cantidadProgramadaEstaEntrega
          : pendienteVentaReal
        if (esParcialAgrupado) {
          return {
            id: index + 1,
            producto: prod.name || p.producto_name || '',
            ubicacion: '',
            total: totalVenta,
            recibido: recibidoReal,
            programado: programadoOtros,
            entregado: entregadoGrupo,
            pendiente: pendienteEstaEntrega,
            entregar: pendienteEstaEntrega,
            entregar_programado: 0,
            unidad_derivada_venta_id: udvId,
            detalle_entrega_producto_id: Number(p?.id || 0) || undefined,
          }
        }
        return {
          id: index + 1,
          producto: prod.name || p.producto_name || '',
          ubicacion: '',
          total: totalVenta,
          recibido: recibidoReal,
          programado: cantidadProgramadaEstaEntrega,
          entregado: 0,
          pendiente: pendienteEstaEntrega,
          entregar: pendienteEstaEntrega,
          entregar_programado: 0,
          unidad_derivada_venta_id: udvId,
          detalle_entrega_producto_id: Number(p?.id || 0) || undefined,
        }
      }

      return {
        id: index + 1,
        producto: prod.name || p.producto_name || '',
        ubicacion: '',
        total: totalVenta,
        recibido: recibidoReal,
        entregado: entregadoReal,
        pendiente: pendienteVentaReal,
        entregar: pendienteVentaReal,
        entregar_programado: 0,
        unidad_derivada_venta_id: udvId,
        detalle_entrega_producto_id: Number(p?.id || 0) || undefined,
      }
    })

    for (const [clave, anterior] of productosAnteriores.entries()) {
      const existeEnActuales = entregaFuente.productos_entregados.some((p: any) => {
        const ud = p.unidad_derivada_venta || {}
        const prod = ud.producto_almacen_venta?.producto_almacen?.producto || {}
        const codigo = prod.cod_producto || ''
        const unidad = ud.unidad_derivada_inmutable?.name || ''
        return `${codigo}|${unidad}`.trim().toLowerCase() === clave
      })
      if (existeEnActuales) continue

      productos.push({
        id: productos.length + 1,
        producto: anterior.producto,
        ubicacion: '',
        total: anterior.cantidad,
        recibido: anterior.cantidad,
        entregado: 0,
        pendiente: 0,
        entregar: 0,
        entregar_programado: 0,
        unidad_derivada_venta_id: -productos.length - 1,
      })
    }

    return productos
  }, [entregaFuente, restante])

  // Opción A: detectar programáticamente si hay que encender el toggle
  // "Programar entrega del resto?" en modo actualizar-entrega.
  // Se activa cuando la entrega es parcial agrupada y tiene hermanas
  // programadas con estado pendiente (tipo_despacho='pr' y estado='pe')
  // y con productos pendientes.
  const tieneHermanaProgramadaConPendientes = useMemo(() => {
    if (restante) return false
    if (entregaFuente?.tipo_entrega !== 'pa') return false
    const grupoId = entregaFuente?.grupo_entrega_id
    if (!grupoId) return false
    const entregasRelacionadas = Array.isArray(entregaFuente?.venta?.entregas_productos)
      ? entregaFuente.venta.entregas_productos
      : []
    const hijasGrupo = entregasRelacionadas.filter((h: any) => {
      if (Number(h?.grupo_entrega_id) !== Number(grupoId)) return false
      return true
    })
    if (hijasGrupo.length === 0) return false

    const hayEntregada = hijasGrupo.some(
      (h: any) => Number(h?.id) !== Number(entregaFuente?.id) && h?.estado_entrega === 'en',
    )
    const esTramoProgramadoActual =
      entregaFuente?.tipo_despacho === 'pr' && entregaFuente?.estado_entrega === 'pe'
    const hayHermanaProgramadaPendiente = hijasGrupo.some(
      (h: any) =>
        Number(h?.id) !== Number(entregaFuente?.id) &&
        h?.tipo_despacho === 'pr' &&
        h?.estado_entrega === 'pe' &&
        (h?.productos_entregados || []).some(
          (p: any) => Number(p?.cantidad_entregada || 0) > 0,
        ),
    )

    return (esTramoProgramadoActual && hayEntregada) || hayHermanaProgramadaPendiente
  }, [entregaFuente, restante])

  // entregaParaMapa debe estar ANTES del return null para no violar las reglas de hooks.
  // También tiene early return interno que hace safe fallback cuando !entrega.
  const entregaParaMapa = useMemo(() => {
    if (!entrega) return null
    const direccionForm =
      form.getFieldValue('direccion_entrega') ||
      form.getFieldValue('_resto_direccion_entrega') ||
      entrega.direccion_entrega
    const refForm =
      form.getFieldValue('referencia_entrega') ||
      form.getFieldValue('_resto_referencia_entrega') ||
      entrega.referencia_entrega
    const latForm =
      form.getFieldValue('latitud') ??
      form.getFieldValue('_resto_latitud') ??
      entrega.latitud
    const lngForm =
      form.getFieldValue('longitud') ??
      form.getFieldValue('_resto_longitud') ??
      entrega.longitud
    return {
      ...entrega,
      direccion_entrega: direccionForm,
      referencia_entrega: refForm,
      latitud: latForm,
      longitud: lngForm,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrega, modalMapaEntregaOpen])

  if (!entrega) return null

  // Mapeo del `tipoLocal` (UI) al `tipoDespachoUI` que renderiza el modal.
  // - 'EnTienda' → UI Parcial con todo oculto excepto la tabla.
  // - 'Domicilio' → UI Domicilio.
  // - 'Parcial' → UI Parcial con counters.
  const tipoDespachoUI: TipoDespachoUI =
    tipoLocal === 'Domicilio' ? 'Domicilio' : 'Parcial'
  const esParcialProgramadoDomicilio =
    entregaFuente?.tipo_entrega === 'pa' && entregaFuente?.tipo_despacho === 'pr'
  const tipoDespachoConfirmacion: TipoDespachoUI =
    esParcialProgramadoDomicilio ? 'Parcial' : tipoDespachoUI

  // Qué secciones se ocultan según el tipo. Comunes a todos: 'omitir' (no
  // aplica al actualizar/crear-resto), 'quien-entrega' (ya fijado en la venta),
  // 'tipo-pedido' (ya fijado en la venta).
  //
  // Para Parcial:
  //   - Parcial (cualquier modo): mostramos 'programar-resto' para que el
  //     usuario pueda entregar parte ahora y programar el resto con
  //     dirección + mapa + chofer + fecha. Aplica igual en restante y
  //     en update (entrega Parcial pendiente que el usuario reabre para
  //     entregar parte y dejar el resto programado).
  //   - EnTienda: nunca tiene resto programable (recojo en tienda).
  const ocultarBase: SeccionOcultable[] = [
    'omitir',
    'quien-entrega',
    'tipo-pedido',
    ...(!restante ? (['programar-resto'] as SeccionOcultable[]) : []),
    ...(ocultarTablaProductos ? (['tabla-productos'] as SeccionOcultable[]) : []),
  ]
  const ocultar: SeccionOcultable[] =
    tipoLocal === 'EnTienda'
      ? [...ocultarBase, 'programar-resto']
      : tipoLocal === 'Domicilio'
      ? [...ocultarBase]
      : [...ocultarBase] // Parcial: incluir programar-resto + mapa

  if (!entrega) return null

  // Header del modal — distingue restante vs actualización normal.
  const tituloPorTipo: Record<TipoDespachoUI, string> = {
    EnTienda: 'Despacho en Tienda',
    Domicilio: 'Despacho a Domicilio',
    Parcial: 'Despacho Parcial',
  }
  const tituloOverride = restante
    ? `Entregar Restante — ${tituloPorTipo[tipoLocal]}`
    : tituloPorTipo[tipoLocal]
  const soloEntregarEnTienda =
    tipoLocal === 'EnTienda' &&
    entrega?.quien_entrega === 'almacen'

  // Para parcial inmediato la cantidad está fijada por la orden — el usuario
  // no debe poder editarla. Solo aplica al actualizar (no al crear restante).
  const readonlyEntregarParcial =
    !restante &&
    entregaFuente?.tipo_entrega === 'pa' &&
    entregaFuente?.tipo_despacho === 'in'

  // Etiqueta read-only de "quién entrega" — viene de la venta y se muestra
  // como info para el usuario (no se vuelve a preguntar).
  const quienEntregaLabel: Record<string, string> = {
    almacen: 'Almacén',
    vendedor: 'Vendedor',
    chofer: 'Chofer',
  }
  const entregaFueEntregadaAntes = Boolean(
    (entrega as any)?.user_entregado_id ||
    (entrega as any)?.userEntregado?.id,
  )
  // Productos anteriores — extraídos del último registro de
  // `venta.historial` con `accion='edicion'`. Usado para renderizar la
  // tabla "Productos anteriores" dentro del modal cuando la venta fue
  // editada (productos intercambiados o eliminados).
  const ultimaEdicion = entregaFueEntregadaAntes
    ? (entrega.venta as any)?.historial?.find?.(
        (h: any) => h.accion === 'edicion',
      )
    : undefined
  const productosAnteriores: Array<{
    codigo: string
    nombre: string
    unidad: string
    cantidad: number
    precio: number
  }> = (ultimaEdicion?.datos_anteriores?.productos || []).flatMap((p: any) =>
    (p?.unidades || []).map((ud: any) => ({
      codigo: p?.codigo || '',
      nombre: p?.nombre || '—',
      unidad: ud?.unidad || '',
      cantidad: Number(ud?.cantidad ?? 0),
      precio: Number(ud?.precio ?? 0),
    })),
  )
  const fechaUltimaEdicion = ultimaEdicion?.fecha
    ? dayjs(ultimaEdicion.fecha).format('DD/MM/YYYY hh:mm A')
    : undefined

  const quienEntregaInfo = (
    <div className="flex flex-col gap-1.5">
      {entrega.quien_entrega && (
        <span>
          Entrega:{' '}
          {quienEntregaLabel[entrega.quien_entrega] ?? entrega.quien_entrega}
        </span>
      )}
      {false && (
        <div className="flex flex-col gap-1 px-2 py-1.5 bg-amber-50 border-l-4 border-amber-500 rounded">
          <div className="flex items-center justify-between flex-wrap gap-x-2">
            <span className="text-amber-700 font-bold text-xs">
              🔄 CAMBIO DE PRODUCTO
            </span>
            {fechaUltimaEdicion && (
              <span className="text-amber-600 text-[10px]">
                {fechaUltimaEdicion}
              </span>
            )}
          </div>
          <div className="text-[10px] text-amber-700 italic mb-0.5">
            Producto anterior (reemplazado):
          </div>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-amber-100 text-amber-800">
                <th className="text-left px-1 py-0.5">Cód.</th>
                <th className="text-left px-1 py-0.5">Producto</th>
                <th className="text-center px-1 py-0.5">U.</th>
                <th className="text-right px-1 py-0.5">Cant.</th>
                <th className="text-right px-1 py-0.5">Precio</th>
              </tr>
            </thead>
            <tbody>
              {productosAnteriores.map((p, i) => (
                <tr
                  key={i}
                  className="border-t border-amber-200 line-through text-gray-500"
                >
                  <td className="px-1 py-0.5">{p.codigo}</td>
                  <td className="px-1 py-0.5">{p.nombre}</td>
                  <td className="text-center px-1 py-0.5">{p.unidad}</td>
                  <td className="text-right px-1 py-0.5">
                    {p.cantidad.toFixed(2)}
                  </td>
                  <td className="text-right px-1 py-0.5">
                    {p.precio.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  // Botón "Cambiar tipo de entrega":
  //   - En modo restante: siempre disponible (la entrega origen no se toca).
  //   - En modo update: solo si la entrega no se completó ('en') ni se canceló ('ca').
  const puedeCambiarTipo =
    restante || (entrega.estado_entrega !== 'en' && entrega.estado_entrega !== 'ca')

  const accionesHeader = (
    <div className="flex items-center gap-2">
      <ButtonBase
        color="danger"
        size="sm"
        onClick={() => openPdfModal(entrega)}
      >
        <FaFilePdf size={11} className="mr-1 inline-block" /> Ticket
      </ButtonBase>
      {(tipoLocal === 'Domicilio' || (restante && tipoLocal === 'Parcial')) && (
        <ButtonBase
          color="info"
          size="sm"
          onClick={() => setModalMapaEntregaOpen(true)}
        >
          <FaMapMarkedAlt size={11} className="mr-1 inline-block" /> Mapa Entrega
        </ButtonBase>
      )}
      {puedeCambiarTipo && (
        <ButtonBase
          color="warning"
          size="sm"
          onClick={() => setModalSeleccionarTipoOpen(true)}
        >
          <FaExchangeAlt size={11} className="mr-1 inline-block" /> Cambiar tipo
        </ButtonBase>
      )}
    </div>
  )

  // Mode del ModalDetallesEntrega — actualizar la entrega existente vs.
  // crear una nueva entrega para los productos pendientes.
  const mode = restante
    ? ({
        kind: 'crear-entrega-resto' as const,
        ventaId: entregaFuente.venta_id,
        entregaOrigen: {
          entrega_id: Number(entregaOperativa?.id || entregaFuente.id),
          almacen_salida_id: entregaFuente.almacen_salida_id,
          grupo_entrega_id: entregaFuente.grupo_entrega_id,
          user_id: entregaFuente.user_id,
        },
      } as const)
    : ({
        kind: 'actualizar-entrega' as const,
        entregaId: Number(entregaOperativa?.id || entregaFuente.id),
      } as const)

  if (requiereHidratacionCompletaParcial) {
    return (
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={titulo ?? 'CONFIGURAR ENTREGA'}
        width={1100}
      >
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <Spin size="large" />
            <span className="text-sm">Cargando detalle de la entrega...</span>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Form form={form} component={false}>
      <ModalDetallesEntrega
        open={open}
        setOpen={setOpen}
        form={form}
        tipoDespacho={tipoDespachoUI}
        tipoDespachoConfirmacion={tipoDespachoConfirmacion}
        mode={mode}
        ocultar={ocultar}
        productosIniciales={productosIniciales}
        tituloOverride={tituloOverride}
        tituloModal={titulo}
        labelConfirmar={labelConfirmar}
        onRecolectar={onRecolectar}
        infoExtra={quienEntregaInfo}
        accionesHeader={accionesHeader}
        clienteNombre={entrega.venta?.cliente?.razon_social || entrega.venta?.cliente?.nombres}
        clienteId={entrega.venta?.cliente_id ?? entrega.venta?.cliente?.id}
        direccion={entrega.direccion_entrega || ''}
        forzarProgramarRestoOn={tieneHermanaProgramadaConPendientes}
        soloEntregarEnTienda={soloEntregarEnTienda}
        readonlyEntregarParcial={readonlyEntregarParcial}
        onConfirmar={() => {
          message.success(restante ? 'Restante entregado' : 'Entrega actualizada')
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
          onSuccess?.()
        }}
        onEditarCliente={() => {
          message.info('Edita el cliente desde la venta original')
        }}
      />

      <ModalMapaEntrega
        open={modalMapaEntregaOpen}
        onClose={() => setModalMapaEntregaOpen(false)}
        entrega={entregaParaMapa}
      />

      <ModalSeleccionarTipoDespacho
        open={modalSeleccionarTipoOpen}
        setOpen={setModalSeleccionarTipoOpen}
        onSelectTipo={handleSelectTipoDespacho}
        defaultTipo={tipoLocal}
      />
    </Form>
  )
}
