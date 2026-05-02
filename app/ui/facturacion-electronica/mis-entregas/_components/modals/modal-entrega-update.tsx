'use client'

import { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FaExchangeAlt, FaFilePdf } from 'react-icons/fa'
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
}: ModalEntregaUpdateProps) {
  const [form] = Form.useForm()
  const { message } = useApp()
  const queryClient = useQueryClient()
  const [modalSeleccionarTipoOpen, setModalSeleccionarTipoOpen] = useState(false)
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)

  // Tipo "UI" actualmente activo. En modo update, se inicializa con el tipo
  // real de la entrega y se persiste en el backend al cambiarlo. En modo
  // restante (la entrega origen ya está cerrada), solo se cambia local —
  // el restante puede tener un tipo distinto al de la entrega origen.
  const tipoInicialUI: TipoDespachoUI = useMemo(() => {
    const t = entrega?.tipo_entrega as 'rt' | 'de' | 'pa' | undefined
    if (t === 'de') return 'Domicilio'
    if (t === 'rt') return 'EnTienda'
    return 'Parcial'
  }, [entrega])
  const [tipoLocal, setTipoLocal] = useState<TipoDespachoUI>(tipoInicialUI)
  // Re-sincronizar cuando cambia la entrega seleccionada (nueva fila).
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

    if (nuevoTipo === entrega.tipo_entrega) {
      message.info('La entrega ya es de ese tipo')
      return
    }

    try {
      const response = await entregaProductoApi.update(entrega.id, {
        tipo_entrega: nuevoTipo,
      })
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
      onSuccess?.()
    } catch (err: any) {
      message.error(err?.message || 'Error al cambiar tipo de entrega')
    }
  }

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
    if (!open || !entrega) return
    if (restante) {
      form.resetFields()
      form.setFieldValue(
        'direccion_seleccionada',
        entrega.venta?.direccion_seleccionada || 'D1',
      )
      return
    }
    form.setFieldsValue({
      quien_entrega: entrega.quien_entrega || 'almacen',
      observaciones: entrega.observaciones || '',
      despachador_id: entrega.chofer_id || undefined,
      tipo_pedido: entrega.tipo_pedido || 'interno',
      cargo_destino: entrega.cargo_destino || undefined,
      fecha_programada: entrega.fecha_programada
        ? dayjs(entrega.fecha_programada).format('YYYY-MM-DD')
        : undefined,
      hora_inicio: entrega.hora_inicio || undefined,
      hora_fin: entrega.hora_fin || undefined,
      direccion_entrega: entrega.direccion_entrega || '',
      referencia_entrega: entrega.referencia_entrega || '',
      latitud: entrega.latitud != null ? Number(entrega.latitud) : undefined,
      longitud: entrega.longitud != null ? Number(entrega.longitud) : undefined,
      vehiculo_id: entrega.vehiculo_id || undefined,
      direccion_seleccionada: entrega.venta?.direccion_seleccionada || 'D1',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entrega?.id, restante, form])

  // Pre-cargar campos `_resto_*` con la dirección del cliente en modo restante.
  //
  // El `<ModalDetallesEntrega>` interno también tiene un useEffect que hace
  // esto, pero depende del switch `programarResto` y de timing. Acá lo
  // hacemos en cuanto llegan las direcciones, antes de que el usuario active
  // el switch — los inputs `_resto_*` recién aparecen al activarlo, así que
  // cuando el componente TextareaBase se monta lee el valor ya seteado en
  // el form. Resuelve el bug donde la "Referencia" salía vacía.
  const clienteIdRestante = restante
    ? entrega?.venta?.cliente_id ?? entrega?.venta?.cliente?.id
    : undefined
  const { data: direccionesResp } = useQuery({
    queryKey: [QueryKeys.DIRECCIONES_CLIENTE, clienteIdRestante],
    queryFn: () => clienteApi.listarDirecciones(clienteIdRestante!),
    enabled: !!clienteIdRestante && open,
  })
  const direccionesCliente = (direccionesResp?.data?.data as any[]) || []

  useEffect(() => {
    if (!open || !restante || direccionesCliente.length === 0) return
    const tipo = (form.getFieldValue('direccion_seleccionada') ||
      entrega?.venta?.direccion_seleccionada ||
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
  }, [open, restante, direccionesCliente, entrega?.id, form])

  // Productos pre-cargados desde la entrega para llenar la tabla.
  // Shape del backend (snake_case):
  //   productos_entregados[].unidad_derivada_venta
  //     .producto_almacen_venta.producto_almacen.producto.name
  //
  // Reglas según el modo:
  //   - restante=true: solo incluir productos con `cantidad_pendiente > 0`
  //     (los que faltan por entregar). `total = pendiente`, `entregado = 0`,
  //     `entregar = pendiente` (sugerencia: entregar todo lo que queda).
  //   - restante=false: comportamiento histórico — si la entrega ya está 'en'
  //     mostrar todo entregado, si está 'pe'/'ec' mostrar entregar = total.
  const productosIniciales: ProductoEntrega[] = useMemo(() => {
    if (!entrega?.productos_entregados) return []

    if (restante) {
      // En modo restante mostramos el total ORIGINAL de la venta (no solo el
      // pendiente). Eso da contexto al usuario: "se vendieron 10, se entregaron
      // 5, quedan 5". El campo `entregar` arranca con el pendiente sugerido,
      // pero el usuario puede entregar solo una parte y programar el resto.
      return entrega.productos_entregados
        .map((p: any, index: number) => {
          const ud = p.unidad_derivada_venta || {}
          const pav = ud.producto_almacen_venta || {}
          const prod = pav.producto_almacen?.producto || {}
          const totalOriginal = Number(ud.cantidad ?? 0)
          const pendiente = Number(ud.cantidad_pendiente || 0)
          if (pendiente <= 0) return null
          const entregadoYa = Math.max(0, totalOriginal - pendiente)
          return {
            id: index + 1,
            producto: prod.name || p.producto_name || '',
            ubicacion: '',
            total: totalOriginal,
            entregado: entregadoYa,
            pendiente,
            entregar: pendiente,
            entregar_programado: 0,
            unidad_derivada_venta_id: ud.id ?? p.unidad_derivada_venta_id,
          }
        })
        .filter(Boolean) as ProductoEntrega[]
    }

    const yaEntregada = entrega.estado_entrega === 'en'
    return entrega.productos_entregados.map((p: any, index: number) => {
      const ud = p.unidad_derivada_venta || {}
      const pav = ud.producto_almacen_venta || {}
      const pa = pav.producto_almacen || {}
      const prod = pa.producto || {}
      const total = Number(ud.cantidad ?? p.cantidad_entregada ?? 0)
      const entregadoReal = yaEntregada ? total : 0
      const pendienteReal = total - entregadoReal
      return {
        id: index + 1,
        producto: prod.name || p.producto_name || '',
        ubicacion: '',
        total,
        entregado: entregadoReal,
        pendiente: pendienteReal,
        entregar: pendienteReal,
        entregar_programado: 0,
        unidad_derivada_venta_id: ud.id ?? p.unidad_derivada_venta_id,
      }
    })
  }, [entrega, restante])

  if (!entrega) return null

  // Mapeo del `tipoLocal` (UI) al `tipoDespachoUI` que renderiza el modal.
  // - 'EnTienda' → UI Parcial con todo oculto excepto la tabla.
  // - 'Domicilio' → UI Domicilio.
  // - 'Parcial' → UI Parcial con counters.
  const tipoDespachoUI: TipoDespachoUI =
    tipoLocal === 'Domicilio' ? 'Domicilio' : 'Parcial'

  // Qué secciones se ocultan según el tipo. Comunes a todos: 'omitir' (no
  // aplica al actualizar/crear-resto), 'quien-entrega' (ya fijado en la venta),
  // 'tipo-pedido' (ya fijado en la venta).
  //
  // Para Parcial:
  //   - Modo restante: NO ocultamos 'programar-resto' — el usuario puede
  //     entregar parte ahora y programar el resto con dirección + mapa + chofer
  //     (igual que al crear la venta).
  //   - Modo update normal: ocultamos 'programar-resto' porque la entrega
  //     existente ya tiene su programación previa y solo se confirma.
  const ocultarBase: SeccionOcultable[] = ['omitir', 'quien-entrega', 'tipo-pedido']
  const ocultar: SeccionOcultable[] =
    tipoLocal === 'EnTienda'
      ? [...ocultarBase, 'programar-resto']
      : tipoLocal === 'Domicilio'
      ? [...ocultarBase]
      : restante
      ? [...ocultarBase] // Parcial restante: incluir programar-resto + mapa
      : [...ocultarBase, 'programar-resto'] // Parcial update: solo tabla + counters

  // Header del modal — distingue restante vs actualización normal.
  const tituloPorTipo: Record<TipoDespachoUI, string> = {
    EnTienda: 'Despacho en Tienda',
    Domicilio: 'Despacho a Domicilio',
    Parcial: 'Despacho Parcial',
  }
  const tituloOverride = restante
    ? `Entregar Restante — ${tituloPorTipo[tipoLocal]}`
    : tituloPorTipo[tipoLocal]

  // Etiqueta read-only de "quién entrega" — viene de la venta y se muestra
  // como info para el usuario (no se vuelve a preguntar).
  const quienEntregaLabel: Record<string, string> = {
    almacen: 'Almacén',
    vendedor: 'Vendedor',
    chofer: 'Chofer',
  }
  const quienEntregaInfo = entrega.quien_entrega
    ? `Entrega: ${quienEntregaLabel[entrega.quien_entrega] ?? entrega.quien_entrega}`
    : undefined

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
        ventaId: entrega.venta_id,
        entregaOrigen: {
          almacen_salida_id: entrega.almacen_salida_id,
          user_id: entrega.user_id,
        },
      } as const)
    : ({ kind: 'actualizar-entrega' as const, entregaId: entrega.id } as const)

  // El `<Form>` provider es necesario porque los `Form.Item` que usa el modal
  // de detalles-entrega (referencia, observaciones, dirección, etc.) consultan
  // el FormContext via React. Sin envolverlos en `<Form>`, Ant Design 5
  // imprime "Can not find FormContext" y `form.setFieldValue` no afecta los
  // inputs aunque sí actualice el store interno del form.
  // `component={false}` evita el render de un `<form>` HTML (no queremos el
  // submit nativo, el onConfirmar lo maneja el botón del modal).
  return (
    <Form form={form} component={false}>
      <ModalDetallesEntrega
        open={open}
        setOpen={setOpen}
        form={form}
        tipoDespacho={tipoDespachoUI}
        mode={mode}
        ocultar={ocultar}
        productosIniciales={productosIniciales}
        tituloOverride={tituloOverride}
        infoExtra={quienEntregaInfo}
        accionesHeader={accionesHeader}
        clienteNombre={entrega.venta?.cliente?.razon_social || entrega.venta?.cliente?.nombres}
        clienteId={entrega.venta?.cliente_id ?? entrega.venta?.cliente?.id}
        direccion={entrega.direccion_entrega || ''}
        onConfirmar={() => {
          message.success(restante ? 'Restante entregado' : 'Entrega actualizada')
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
          onSuccess?.()
        }}
        onEditarCliente={() => {
          message.info('Edita el cliente desde la venta original')
        }}
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
