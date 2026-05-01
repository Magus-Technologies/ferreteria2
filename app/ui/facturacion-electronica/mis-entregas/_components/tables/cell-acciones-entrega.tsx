'use client'

import { useState, useEffect } from 'react'
import {
  FaMapMarkedAlt,
  FaEye,
  FaTruck,
  FaFilePdf,
  FaCheckCircle,
} from 'react-icons/fa'
import { MoreOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import { entregaProductoApi, EstadoEntrega } from '~/lib/api/entrega-producto'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import ModalConfirmarEntrega from '../modals/modal-confirmar-entrega'
import ModalDetallesEntregaCompleto from '../modals/modal-detalles-entrega-completo'
import ModalEntregaUpdate from '../modals/modal-entrega-update'
import { useStoreEntregaSeleccionada } from './table-mis-entregas'

interface CellAccionesEntregaProps {
  entrega?: any
  onRefetch?: () => void
}

export default function CellAccionesEntrega({ entrega, onRefetch }: CellAccionesEntregaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalDespachoOpen, setModalDespachoOpen] = useState(false)
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false)
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false)
  const [modalMarcarOpen, setModalMarcarOpen] = useState(false)
  const [modalParcialOpen, setModalParcialOpen] = useState(false)
  const [modalSeleccionarTipoOpen, setModalSeleccionarTipoOpen] = useState(false)
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)
  const { message } = useApp()
  const queryClient = useQueryClient()
  const openPostDespacho = useStoreEntregaSeleccionada((s) => s.openPostDespacho)
  const entregaSeleccionada = useStoreEntregaSeleccionada((s) => s.entrega)
  const accionTrigger = useStoreEntregaSeleccionada((s) => s.accionTrigger)
  const triggerAccion = useStoreEntregaSeleccionada((s) => s.triggerAccion)

  // Escuchar el trigger del botón principal (filter) — solo la fila seleccionada
  // responde al trigger y abre el modal correspondiente.
  //
  // IMPORTANTE: cada tipo de entrega abre un modal DISTINTO y SIN PDF
  // (el PDF solo se ve desde el dropdown de la fila). El modal de despacho
  // antiguo (con PDF embebido) ya no se usa para entregar — solo para casos
  // legacy si el filter envía 'despachar' explícito.
  useEffect(() => {
    if (!accionTrigger || !entrega) return
    if (entregaSeleccionada?.id !== entrega.id) return
    if (accionTrigger === 'marcar') setModalMarcarOpen(true)
    else if (accionTrigger === 'parcial') setModalParcialOpen(true)
    else if (accionTrigger === 'confirmar') setModalConfirmarOpen(true)
    else if (accionTrigger === 'despachar') setModalDespachoOpen(true)
    triggerAccion(null) // resetear el trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accionTrigger])

  if (!entrega) return null

  const handleCrearGuia = () => {
    if (!entrega.venta_id) {
      message.error('No se pudo identificar la venta')
      return
    }
    // Pasar venta_id + placa del vehículo de la entrega para pre-llenar la guía.
    // NO se pasa chofer_id: en entregaproducto.chofer_id se guarda el user.id
    // del DESPACHADOR (interno), pero la guía SUNAT necesita un chofer externo
    // de la tabla `chofer` (con dni/licencia). Son conceptos distintos —
    // el usuario debe seleccionar/registrar el chofer SUNAT manualmente.
    const params = new URLSearchParams({ venta_id: entrega.venta_id })
    if (entrega.vehiculo?.placa) params.set('vehiculo_placa', String(entrega.vehiculo.placa))
    router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?${params.toString()}`)
  }

  // Cambiar tipo de entrega (rt/de/pa). Llama al endpoint update con
  // tipo_entrega y refresca la lista. Si elige el mismo tipo, avisa y sale.
  const handleSelectTipoDespacho = async (
    tipo: 'EnTienda' | 'Domicilio' | 'Parcial',
  ) => {
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
      setModalSeleccionarTipoOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      if (onRefetch) onRefetch()
    } catch (err: any) {
      message.error(err?.message || 'Error al cambiar tipo de entrega')
    }
  }

  const handleEntregar = async () => {
    setLoading(true)
    try {
      const response = await entregaProductoApi.update(entrega.id, {
        estado_entrega: EstadoEntrega.ENTREGADO,
      })

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

  const handleAceptar = async () => {
    setLoading(true)
    try {
      const response = await entregaProductoApi.aceptar(entrega.id)

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
    entrega.tipo_pedido === 'externo' &&
    !entrega.chofer_id &&
    entrega.estado_entrega === 'pe'

  const onSuccess = () => {
    if (onRefetch) onRefetch()
  }

  // Texto del item PDF según estado: "Vale de Recojo" (pe) vs "Ticket de Entrega" (en).
  const pdfLabel =
    entrega.estado_entrega === 'pe'
      ? 'Imprimir Vale de Recojo'
      : entrega.estado_entrega === 'ec'
      ? 'Imprimir Entrega en Camino'
      : entrega.estado_entrega === 'ca'
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
      onClick: () => openPdfModal(entrega),
    },
    // Ver Mapa solo aplica para entregas a domicilio o parciales — en
    // recojo en tienda no hay dirección de entrega ni viaje del chofer.
    ...(entrega.tipo_entrega !== 'rt'
      ? [
          {
            key: 'mapa',
            label: (
              <span className="flex items-center gap-2">
                <FaMapMarkedAlt className="text-blue-600" /> Ver Mapa
              </span>
            ),
            onClick: () => openPostDespacho(entrega),
          } as const,
        ]
      : []),
    {
      key: 'guia',
      label: (
        <span className="flex items-center gap-2">
          <FaTruck className="text-cyan-700" /> Crear Guía de Remisión
        </span>
      ),
      onClick: handleCrearGuia,
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

      {/* Modal de actualizar entrega (rt/de/pa) — reusa `ModalDetallesEntrega`
          de `mis-ventas/crear-venta` configurado para actualizar una entrega
          existente. Reemplaza ModalMarcarEntregada / ModalEntregarParcial /
          ModalDespachoEntrega. El triger viene de `accionTrigger` (filters)
          y mapea a 'marcar' (rt) | 'parcial' (pa) | 'despachar' (de). */}
      <ModalEntregaUpdate
        open={modalMarcarOpen || modalParcialOpen || modalDespachoOpen}
        setOpen={(o) => {
          if (!o) {
            setModalMarcarOpen(false)
            setModalParcialOpen(false)
            setModalDespachoOpen(false)
          }
        }}
        entrega={entrega}
        onSuccess={onSuccess}
      />

      {/* Modal de Confirmar Entrega */}
      <ModalConfirmarEntrega
        open={modalConfirmarOpen}
        onClose={() => setModalConfirmarOpen(false)}
        onConfirmar={handleEntregar}
        entrega={entrega}
        loading={loading}
      />

      {/* Selector de tipo de entrega (EnTienda / Domicilio / Parcial) —
          se abre desde el dropdown "Cambiar Tipo de Entrega". */}
      <ModalSeleccionarTipoDespacho
        open={modalSeleccionarTipoOpen}
        setOpen={setModalSeleccionarTipoOpen}
        onSelectTipo={handleSelectTipoDespacho}
      />
    </div>
  )
}
