'use client'

import { useState, useEffect } from 'react'
import {
  FaMapMarkedAlt,
  FaEye,
  FaTruck,
  FaFilePdf,
  FaCheckCircle,
  FaUndoAlt,
} from 'react-icons/fa'
import { MoreOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import { entregasNuevasApi } from '~/lib/api/entregas'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import ModalConfirmarEntrega from '../modals/modal-confirmar-entrega'
import ModalDetallesEntregaCompleto from '../modals/modal-detalles-entrega-completo'
import ModalAnularEntrega from '../modals/modal-anular-entrega'
import { useStoreEntregaSeleccionada } from './table-mis-entregas'
import { getEntregaOperativa } from '../../_lib/entregas-parciales'

interface CellAccionesEntregaProps {
  entrega?: any
  onRefetch?: () => void
}

export default function CellAccionesEntrega({ entrega, onRefetch }: CellAccionesEntregaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false)
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false)
  const [modalAnularOpen, setModalAnularOpen] = useState(false)
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)
  const { message } = useApp()
  const queryClient = useQueryClient()
  const openPostDespacho = useStoreEntregaSeleccionada((s) => s.openPostDespacho)
  const entregaSeleccionada = useStoreEntregaSeleccionada((s) => s.entrega)
  const accionTrigger = useStoreEntregaSeleccionada((s) => s.accionTrigger)
  const triggerAccion = useStoreEntregaSeleccionada((s) => s.triggerAccion)
  const openUpdateModal = useStoreEntregaSeleccionada((s) => s.openUpdateModal)
  const entregaOperativa = getEntregaOperativa(entrega) || entrega

  // Escuchar el trigger del botón principal (filter) — solo la fila seleccionada
  // responde al trigger y abre el modal correspondiente.
  //
  // IMPORTANTE: cada tipo de entrega abre un modal DISTINTO y SIN PDF
  // (el PDF solo se ve desde el dropdown de la fila). El modal de despacho
  // antiguo (con PDF embebido) ya no se usa para entregar — solo para casos
  // legacy si el filter envía 'despachar' explícito.
  useEffect(() => {
// Use entrega (not entregaOperativa) for ID check since entregaOperativa
    // is derived from entrega and the store also stores the raw entrega.
    const entregaId = (entrega as any)?.id
    const selectedId = (entregaSeleccionada as any)?.id
    if (!accionTrigger || !entrega) return
    if (String(entregaId) !== String(selectedId)) return
    if (accionTrigger === 'marcar') openUpdateModal(entregaOperativa, false)
    // Parcial agrupado con un tramo ya entregado y otro programado pendiente:
    // esto NO es "entregar restante". El usuario está confirmando la entrega
    // programada existente, así que debemos abrir `actualizar-entrega` sobre
    // la fila agrupada para que `modal-entrega-update` resuelva la hija
    // operativa pendiente y actualice ESA entrega en lugar de crear otra.
    if (accionTrigger === 'parcial') {
      openUpdateModal(
        (entrega as any)?.__esParcialAgrupado ? entrega : entregaOperativa,
        false,
      )
    }
    else if (accionTrigger === 'confirmar') setModalConfirmarOpen(true)
    else if (accionTrigger === 'confirmar-ec') {
      // Confirmar TODOS los eventos 'ec' (En Camino) de la entrega.
      // No abre modal — ejecuta directo y refresca.
      ;(async () => {
        try {
          const r = await entregasNuevasApi.enCamino(Number(entregaOperativa.id))
          if (r.error) {
            message.error(r.error.message || 'Error al marcar en camino')
            return
          }
          message.success('Entrega marcada en camino')
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
          if (onRefetch) onRefetch()
        } catch (err: any) {
          message.error(err?.message || 'Error al marcar en camino')
        }
      })()
    }
    else if (accionTrigger === 'despachar') openUpdateModal(entregaOperativa, false)
    else if (accionTrigger === 'restante') openUpdateModal(
      (entrega as any)?.__esParcialAgrupado ? entrega : entregaOperativa,
      true,
    )
    triggerAccion(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accionTrigger])

  if (!entrega) return null

  // Verificar si todos los productos ya fueron completamente guiados
  const todoGuiado = entregaOperativa.productos_entregados?.length > 0 &&
    entregaOperativa.productos_entregados.every((p: any) => {
      const ud = p.unidad_derivada_venta
      if (!ud) return false
      return Number(ud.cantidad_guiada ?? 0) >= Number(ud.cantidad ?? 0)
    })

  const handleCrearGuia = () => {
    if (!entregaOperativa.venta_id) {
      message.error('No se pudo identificar la venta')
      return
    }
    // Pasamos venta_id + placa del vehículo + user_chofer_id (el USER
    // despachador) al form de crear-guia. La guía PRIVADA (la empresa
    // misma transporta su mercadería) usa los datos SUNAT del USER:
    // numero_documento, name, licencia_conducir. La tabla externa `chofer`
    // se reserva para PÚBLICO o GRE-Transportista.
    const params = new URLSearchParams({ venta_id: entregaOperativa.venta_id })
    // entrega_id: para que crear-guia pre-cargue las cantidades de ESTA entrega
    // (no el total de la venta). Sin esto cargaba la venta completa.
    if (entregaOperativa.id) params.set('entrega_id', String(entregaOperativa.id))
    if (entregaOperativa.vehiculo?.placa) params.set('vehiculo_placa', String(entregaOperativa.vehiculo.placa))
    if (entregaOperativa.chofer_id) params.set('user_chofer_id', String(entregaOperativa.chofer_id))
    if (entregaOperativa.chofer?.name) params.set('user_chofer_nombre', String(entregaOperativa.chofer.name))
    router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?${params.toString()}`)
  }

  const handleEntregar = async () => {
    setLoading(true)
    try {
      const response = await entregasNuevasApi.confirmar(Number(entregaOperativa.id))

      if (response.error) {
        message.error(response.error.message || 'Error al completar entrega')
        return
      }

      message.success('Entrega completada exitosamente')
      setModalConfirmarOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      if (onRefetch) onRefetch()
    } catch (error) {
      console.error('Error al completar entrega:', error)
      message.error('Error al completar entrega')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarEnCamino = async () => {
    setLoading(true)
    try {
      const response = await entregasNuevasApi.enCamino(Number(entregaOperativa.id))

      if (response.error) {
        message.error(response.error.message || 'Error al marcar en camino')
        return
      }

      message.success('Entrega marcada en camino')
      setModalConfirmarOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      if (onRefetch) onRefetch()
    } catch (error) {
      console.error('Error al marcar en camino:', error)
      message.error('Error al marcar en camino')
    } finally {
      setLoading(false)
    }
  }

  const handleAceptar = async () => {
    setLoading(true)
    try {
      const response = await entregasNuevasApi.aceptarPedido(Number(entregaOperativa.id))

      if (response.error) {
        if (response.error.message?.includes('ya fue aceptada')) {
          message.warning('Esta entrega ya fue aceptada por otro usuario')
        } else {
          message.error(response.error.message || 'Error al aceptar entrega')
        }
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
        return
      }

      message.success('Pedido aceptado exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      if (onRefetch) onRefetch()
    } catch (error) {
      console.error('Error al aceptar entrega:', error)
      message.error('Error al aceptar la entrega')
    } finally {
      setLoading(false)
    }
  }

  // Es un pedido externo sin aceptar?
  const esPedidoExternoDisponible =
    entregaOperativa.tipo_pedido === 'externo' &&
    !entregaOperativa.chofer_id &&
    entregaOperativa.estado_entrega === 'pe'

  const onSuccess = () => {
    if (onRefetch) onRefetch()
  }

  // Texto del item PDF según tipo + estado.
  const pdfLabel =
    entregaOperativa.estado_entrega === 'pe'
      ? entregaOperativa.tipo_entrega === 'de'
        ? 'Imprimir Vale de Despacho'
        : entregaOperativa.tipo_entrega === 'pa'
        ? 'Imprimir Vale de Entrega Parcial'
        : 'Imprimir Vale de Recojo'
      : entregaOperativa.estado_entrega === 'ec'
      ? 'Imprimir Entrega en Camino'
      : entregaOperativa.estado_entrega === 'ca'
      ? 'Imprimir Entrega Cancelada'
      : 'Imprimir Ticket de Entrega'

  // Construir el menú del dropdown — mismo patrón que mis-ventas
  // (cell-acciones-venta-dropdown).
  const menuItems: MenuProps['items'] = [
    {
      key: 'detalles',
      label: (
        <span className="flex items-center gap-2">
          <FaEye className="text-slate-600" /> Ver Detalles
        </span>
      ),
      onClick: () => setModalDetallesOpen(true),
    },
    {
      key: 'pdf',
      label: (
        <span className="flex items-center gap-2">
          <FaFilePdf className="text-red-600" /> {pdfLabel}
        </span>
      ),
      onClick: () => openPdfModal(entregaOperativa),
    },
    // Ver Mapa solo aplica para entregas a domicilio o parciales — en
    // recojo en tienda no hay dirección de entrega ni viaje del chofer.
    ...(entregaOperativa.tipo_entrega !== 'rt'
      ? [
          {
            key: 'mapa',
            label: (
              <span className="flex items-center gap-2">
                <FaMapMarkedAlt className="text-blue-600" /> Ver Mapa
              </span>
            ),
            onClick: () => openPostDespacho(entregaOperativa),
          } as const,
        ]
      : []),
    {
      key: 'guia',
      label: (
        <span className="flex items-center gap-2">
          <FaTruck className={todoGuiado ? 'text-gray-400' : 'text-cyan-700'} />
          {todoGuiado ? 'Guía completa (todo guiado)' : 'Crear Guía de Remisión'}
        </span>
      ),
      onClick: todoGuiado ? undefined : handleCrearGuia,
      disabled: todoGuiado,
    },
    ...(esPedidoExternoDisponible
      ? [
          { type: 'divider' as const },
          {
            key: 'aceptar',
            label: (
              <span className="flex items-center gap-2 font-semibold">
                <FaCheckCircle className="text-green-600" /> Aceptar Pedido
              </span>
            ),
            onClick: handleAceptar,
            disabled: loading,
          } as const,
        ]
      : []),
    // Anular entrega — solo si está EN_CAMINO o ENTREGADA. Permite
    // deshacer un "marcar entregada" hecho por error. Vuelve a 'pe'
    // (pendiente) y registra el motivo. NO toca stock ni SUNAT.
    ...(entregaOperativa.estado_entrega === 'en' || entregaOperativa.estado_entrega === 'ec'
      ? [
          { type: 'divider' as const },
          {
            key: 'anular-entrega',
            label: (
              <span className="flex items-center gap-2 text-amber-700">
                <FaUndoAlt className="text-amber-600" /> Anular Entrega
              </span>
            ),
            onClick: () => setModalAnularOpen(true),
          } as const,
        ]
      : []),
  ]

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        height: '100%',
        alignItems: 'center',
      }}
    >
      <ConfigurableElement
        componentId="mis-entregas.dropdown-acciones"
        label="Dropdown Acciones"
        noFullWidth
      >
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <ButtonBase
            color="info"
            size="md"
            className="flex items-center justify-center !px-2"
            title="Acciones"
            disabled={loading}
          >
            <MoreOutlined style={{ fontSize: '18px' }} />
          </ButtonBase>
        </Dropdown>
      </ConfigurableElement>

      {/* Botones principales "Entregar/Despachar/Confirmar" se movieron arriba
          al lado de Buscar (filters-mis-entregas). El botón "Parcial" se movió
          dentro del modal de Despacho. Las opciones "Restante" y "Cambiar tipo
          entrega" viven dentro del modal de Despacho. */}

      <ModalDetallesEntregaCompleto
        open={modalDetallesOpen}
        onClose={() => setModalDetallesOpen(false)}
        entrega={entrega}
      />

      {/* Modal del PDF de entrega vive a nivel de página
          (ModalPdfEntregaWrapper en mis-entregas/page.tsx) — se abre via
          useStoreModalPdfEntrega.openModal(entrega). */}

      {/* ModalEntregaUpdate vive en TableMisEntregas (fuera de AG Grid)
          para sobrevivir re-renders de la tabla. Se abre via openUpdateModal(). */}

      {/* Modal de Confirmar Entrega */}
      <ModalConfirmarEntrega
        open={modalConfirmarOpen}
        onClose={() => setModalConfirmarOpen(false)}
        onConfirmar={handleEntregar}
        onMarcarEnCamino={handleMarcarEnCamino}
        entrega={entregaOperativa}
        loading={loading}
        loadingEnCamino={loading}
      />

      {/* Modal para anular una entrega marcada como entregada por error */}
      <ModalAnularEntrega
        open={modalAnularOpen}
        onClose={() => setModalAnularOpen(false)}
        entrega={entregaOperativa}
        onSuccess={onSuccess}
      />

    </div>
  )
}
