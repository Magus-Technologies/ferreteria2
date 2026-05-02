'use client'

import { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useQueryClient } from '@tanstack/react-query'
import { FaExchangeAlt } from 'react-icons/fa'
import dayjs from 'dayjs'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregaProductoApi, TipoEntrega } from '~/lib/api/entrega-producto'
import ModalDetallesEntrega from '../../../mis-ventas/crear-venta/_components/modals/modal-detalles-entrega'
import ModalSeleccionarTipoDespacho from '../../../mis-ventas/crear-venta/_components/modals/modal-seleccionar-tipo-despacho'
import type {
  SeccionOcultable,
  TipoDespachoUI,
} from '../../../mis-ventas/crear-venta/_components/modals/detalles-entrega/types'
import type { ProductoEntrega } from '../../../mis-ventas/_hooks/use-productos-entrega'

interface ModalEntregaUpdateProps {
  open: boolean
  setOpen: (open: boolean) => void
  entrega?: any
  onSuccess?: () => void
}

/**
 * Wrapper que reusa `<ModalDetallesEntrega>` (refactorizado en
 * `mis-ventas/crear-venta`) para ACTUALIZAR una entrega existente desde
 * `mis-entregas`. Reemplaza los modales viejos `ModalMarcarEntregada`,
 * `ModalEntregarParcial` y la acción "Despachar" del `ModalDespachoEntrega`.
 *
 * Para todos los tipos de entrega se usa la UI de "Parcial" (tabla de
 * productos + botón Entregar). El `quien_entrega` ya se eligió al crear la
 * venta, así que se oculta junto con el resto de campos no editables aquí.
 */
export default function ModalEntregaUpdate({
  open,
  setOpen,
  entrega,
  onSuccess,
}: ModalEntregaUpdateProps) {
  const [form] = Form.useForm()
  const { message } = useApp()
  const queryClient = useQueryClient()
  const [modalSeleccionarTipoOpen, setModalSeleccionarTipoOpen] = useState(false)

  // Cambiar tipo de entrega (rt/de/pa) — llamado desde el botón en el header.
  const handleSelectTipoDespacho = async (
    tipo: 'EnTienda' | 'Domicilio' | 'Parcial',
  ) => {
    const nuevoTipo: TipoEntrega =
      tipo === 'EnTienda'
        ? TipoEntrega.RECOJO_EN_TIENDA
        : tipo === 'Domicilio'
        ? TipoEntrega.DESPACHO
        : TipoEntrega.PARCIAL

    if (!entrega) return
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
      setModalSeleccionarTipoOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      onSuccess?.()
    } catch (err: any) {
      message.error(err?.message || 'Error al cambiar tipo de entrega')
    }
  }

  // Pre-llenar el form con los valores actuales de la entrega cada vez
  // que se abre el modal o cambia la entrega.
  useEffect(() => {
    if (!open || !entrega) return
    form.setFieldsValue({
      quien_entrega: entrega.quien_entrega || 'almacen',
      observaciones: entrega.observaciones || '',
      // Datos de Domicilio — el chofer puede editarlos antes de salir.
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
    })
  }, [open, entrega, form])

  // Productos pre-cargados desde la entrega para llenar la tabla — el modal
  // los recibe vía `productosIniciales` (en lugar de derivar del form).
  // Shape del backend (snake_case):
  //   productos_entregados[].unidad_derivada_venta
  //     .producto_almacen_venta.producto_almacen.producto.name
  //
  // IMPORTANTE: el backend al crear la venta auto-crea el detalle de entrega
  // con `cantidad_entregada = total` y `cantidad_pendiente = 0` ANTES de que
  // se haya entregado físicamente (es solo el "plan"). Solo cuando
  // `estado_entrega='en'` la entrega está realmente completada. Por eso aquí
  // se interpreta `cantidad_entregada` según el estado:
  //   - 'en' (entregado): la entrega ya se completó, mostrar todo entregado.
  //   - 'pe' (pendiente) / 'ec' (en camino): nada se ha entregado todavía,
  //     el `entregar` por defecto es la cantidad total para que el usuario
  //     solo tenga que confirmar (o ajustar si es entrega parcial).
  const productosIniciales: ProductoEntrega[] = useMemo(() => {
    if (!entrega?.productos_entregados) return []
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
        // Por defecto sugerimos entregar todo lo pendiente. Si la entrega
        // ya está completada, `entregar=0` (no hay nada por hacer).
        entregar: pendienteReal,
        entregar_programado: 0,
        unidad_derivada_venta_id: ud.id ?? p.unidad_derivada_venta_id,
      }
    })
  }, [entrega])

  if (!entrega) return null

  // Mapeo del `tipo_entrega` (API) al `tipoDespachoUI` que renderiza el modal.
  // - 'rt' (Recojo en Tienda) → usamos UI de Parcial PERO con todo oculto
  //   excepto la tabla, porque el modal nativo de EnTienda no tiene tabla.
  // - 'de' (Domicilio)        → UI de Domicilio: tabla + dirección + mapa +
  //   fecha + chofer + vehículo + observaciones.
  // - 'pa' (Parcial)          → UI de Parcial: tabla + counters.
  const tipoEntrega = entrega.tipo_entrega as 'rt' | 'de' | 'pa'
  const tipoDespachoUI: TipoDespachoUI =
    tipoEntrega === 'de' ? 'Domicilio' : 'Parcial'

  // Qué secciones se ocultan según el tipo. Comunes a todos: 'omitir' (no
  // aplica al actualizar), 'quien-entrega' (ya fijado), 'tipo-pedido' (ya
  // fijado en la venta).
  const ocultarBase: SeccionOcultable[] = ['omitir', 'quien-entrega', 'tipo-pedido']
  const ocultar: SeccionOcultable[] =
    tipoEntrega === 'rt'
      ? [...ocultarBase, 'programar-resto'] // RT: solo tabla
      : tipoEntrega === 'de'
      ? [...ocultarBase] // Domicilio: tabla + datos de despacho
      : [...ocultarBase, 'programar-resto'] // Parcial: tabla + counters (sin resto)

  // Header del modal según el tipo real de entrega.
  const tituloPorTipo: Record<string, string> = {
    rt: 'Despacho en Tienda',
    de: 'Despacho a Domicilio',
    pa: 'Despacho Parcial',
  }
  const tituloOverride = tituloPorTipo[tipoEntrega] ?? 'Configurar Entrega'

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

  // Botón "Cambiar tipo de entrega" — solo si la entrega no se completó
  // ('en') ni se canceló ('ca'). Una vez entregada/cancelada no tiene sentido.
  const puedeCambiarTipo = entrega.estado_entrega !== 'en' && entrega.estado_entrega !== 'ca'
  const accionesHeader = puedeCambiarTipo ? (
    <button
      type="button"
      onClick={() => setModalSeleccionarTipoOpen(true)}
      className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
    >
      <FaExchangeAlt size={11} />
      Cambiar tipo
    </button>
  ) : null

  return (
    <>
      <ModalDetallesEntrega
        open={open}
        setOpen={setOpen}
        form={form}
        tipoDespacho={tipoDespachoUI}
        mode={{ kind: 'actualizar-entrega', entregaId: entrega.id }}
        ocultar={ocultar}
        productosIniciales={productosIniciales}
        tituloOverride={tituloOverride}
        infoExtra={quienEntregaInfo}
        accionesHeader={accionesHeader}
        clienteNombre={entrega.venta?.cliente?.razon_social || entrega.venta?.cliente?.nombres}
        direccion={entrega.direccion_entrega || ''}
        onConfirmar={() => {
          message.success('Entrega actualizada')
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
      />
    </>
  )
}
