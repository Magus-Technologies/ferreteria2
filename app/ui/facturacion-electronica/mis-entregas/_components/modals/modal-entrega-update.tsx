'use client'

import { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useQueryClient } from '@tanstack/react-query'
import { FaExchangeAlt } from 'react-icons/fa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregaProductoApi, TipoEntrega } from '~/lib/api/entrega-producto'
import ModalDetallesEntrega from '../../../mis-ventas/crear-venta/_components/modals/modal-detalles-entrega'
import ModalSeleccionarTipoDespacho from '../../../mis-ventas/crear-venta/_components/modals/modal-seleccionar-tipo-despacho'
import type { SeccionOcultable } from '../../../mis-ventas/crear-venta/_components/modals/detalles-entrega/types'
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
    })
  }, [open, entrega, form])

  // Productos pre-cargados desde la entrega para llenar la tabla — el modal
  // los recibe vía `productosIniciales` (en lugar de derivar del form).
  // Shape del backend (snake_case):
  //   productos_entregados[].unidad_derivada_venta
  //     .producto_almacen_venta.producto_almacen.producto.name
  const productosIniciales: ProductoEntrega[] = useMemo(() => {
    if (!entrega?.productos_entregados) return []
    return entrega.productos_entregados.map((p: any, index: number) => {
      const ud = p.unidad_derivada_venta || {}
      const pav = ud.producto_almacen_venta || {}
      const pa = pav.producto_almacen || {}
      const prod = pa.producto || {}
      const total = Number(ud.cantidad ?? p.cantidad_entregada ?? 0)
      const entregado = Number(p.cantidad_entregada ?? 0)
      const pendiente = Number(ud.cantidad_pendiente ?? Math.max(0, total - entregado))
      return {
        id: index + 1,
        producto: prod.name || p.producto_name || '',
        ubicacion: '',
        total,
        entregado,
        pendiente,
        entregar: pendiente,
        entregar_programado: 0,
        unidad_derivada_venta_id: ud.id ?? p.unidad_derivada_venta_id,
      }
    })
  }, [entrega])

  if (!entrega) return null

  // Para mis-entregas siempre usamos la UI de Parcial (tabla + entregar).
  // El "quien_entrega", "tipo_pedido", etc. ya quedaron fijados al crear la
  // venta, por eso se ocultan acá.
  const ocultar: SeccionOcultable[] = [
    'quien-entrega',
    'omitir',
    'tipo-pedido',
    'programar-resto',
  ]

  // Header del modal según el tipo real de entrega (no el tipoDespacho UI).
  const tituloPorTipo: Record<string, string> = {
    rt: 'Despacho en Tienda',
    de: 'Despacho a Domicilio',
    pa: 'Despacho Parcial',
  }
  const tituloOverride = tituloPorTipo[entrega.tipo_entrega as string] ?? 'Configurar Entrega'

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
        tipoDespacho="Parcial"
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
