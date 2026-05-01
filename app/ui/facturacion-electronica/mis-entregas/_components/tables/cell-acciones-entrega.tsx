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
import { entregaProductoApi, EstadoEntrega, TipoEntrega } from '~/lib/api/entrega-producto'
import { ventaApi, type getVentaResponseProps } from '~/lib/api/venta'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import ModalDespachoEntrega from '../modals/modal-despacho-entrega'
import ModalConfirmarEntrega from '../modals/modal-confirmar-entrega'
import ModalDetallesEntregaCompleto from '../modals/modal-detalles-entrega-completo'
import ModalMarcarEntregada from '../modals/modal-marcar-entregada'
import ModalEntregarParcial from '../modals/modal-entregar-parcial'
import ModalEntregarVenta from '../../../mis-ventas/_components/modals/modal-entregar-venta'
import ModalSeleccionarTipoDespacho from '../../../mis-ventas/crear-venta/_components/modals/modal-seleccionar-tipo-despacho'
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
  const [modalRestanteOpen, setModalRestanteOpen] = useState(false)
  const [modalSeleccionarTipoOpen, setModalSeleccionarTipoOpen] = useState(false)
  const [ventaCompleta, setVentaCompleta] = useState<getVentaResponseProps | undefined>()
  const [loadingRestante, setLoadingRestante] = useState(false)
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

  // Hay restante por entregar si alguna unidad de la venta tiene cantidad_pendiente > 0.
  const tieneRestante = (entrega.productos_entregados || []).some(
    (p: any) => Number(p?.unidad_derivada_venta?.cantidad_pendiente || 0) > 0,
  )

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

  // Abre el ModalSeleccionarTipoDespacho que YA EXISTE en mis-ventas/crear-venta
  // — muestra los 3 tipos (EnTienda 🏪 / Domicilio 🚚 / Parcial 📦) en cards.
  //
  // CIERRA el modal de Despacho ANTES de abrir el selector. Si no se cierra,
  // el selector aparece detrás del ModalDespachoEntrega + su barra flotante
  // (zIndex 2100) y el usuario no lo ve.
  const handleCambiarTipoEntrega = () => {
    setModalDespachoOpen(false)
    // Pequeño delay para que se cierre primero el modal de despacho y su portal,
    // así el selector se monta limpio sin overlap de z-index.
    setTimeout(() => setModalSeleccionarTipoOpen(true), 100)
  }

  // Mapeo del tipo del modal (EnTienda/Domicilio/Parcial) al enum del API
  // (rt/de/pa). Cuando el usuario confirma, actualizamos la entrega.
  const handleSelectTipoDespacho = async (
    tipo: 'EnTienda' | 'Domicilio' | 'Parcial',
  ) => {
    const nuevoTipo: TipoEntrega = tipo === 'EnTienda'
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
      const labelNuevo = tipo === 'EnTienda'
        ? 'Recojo en Tienda'
        : tipo === 'Domicilio'
        ? 'Despacho a Domicilio'
        : 'Despacho Parcial'
      message.success(`Tipo de entrega cambiado a ${labelNuevo}`)
      setModalDespachoOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      if (onRefetch) onRefetch()
    } catch (err: any) {
      message.error(err?.message || 'Error al cambiar tipo de entrega')
    }
  }

  const handleAbrirRestante = async () => {
    if (!entrega.venta_id) {
      message.error('No se pudo identificar la venta')
      return
    }
    setLoadingRestante(true)
    try {
      const res = await ventaApi.getById(entrega.venta_id)
      if (res.error || !res.data) {
        message.error(res.error?.message || 'Error al cargar la venta')
        return
      }
      // ventaApi.getById devuelve { data: { data: venta } } en algunos casos
      const venta = (res.data as any).data ?? res.data
      setVentaCompleta(venta)
      setModalRestanteOpen(true)
    } catch (err: any) {
      message.error(err?.message || 'Error al cargar la venta')
    } finally {
      setLoadingRestante(false)
    }
  }

  const handleDespachar = async (vehiculoId?: number) => {
    try {
      // Para Recojo en Tienda no hay viaje del chofer — al "despachar" la
      // entrega se cierra directamente en ENTREGADO (cliente está físicamente
      // en la tienda recibiendo). Para Domicilio/Parcial pasa a EN_CAMINO
      // y luego se confirma con otro paso cuando el chofer vuelve.
      const esRecojoTienda = entrega.tipo_entrega === 'rt'
      const nuevoEstado = esRecojoTienda
        ? EstadoEntrega.ENTREGADO
        : EstadoEntrega.EN_CAMINO

      const response = await entregaProductoApi.update(entrega.id, {
        estado_entrega: nuevoEstado,
        ...(vehiculoId ? { vehiculo_id: vehiculoId } : {}),
      })

      if (response.error) {
        message.error(response.error.message || 'Error al actualizar estado')
        return
      }

      message.success(
        esRecojoTienda
          ? 'Entrega completada'
          : 'Entrega despachada correctamente',
      )
      setModalDespachoOpen(false)

      // Para domicilio: abrir mapa post-despacho. Para RT no aplica.
      if (!esRecojoTienda) {
        openPostDespacho(entrega)
      }

      // Refrescar tabla
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      if (onRefetch) onRefetch()
    } catch (error) {
      console.error('Error al despachar:', error)
      message.error('Error al despachar la entrega')
    }
  }

  const handleDespacharMasTarde = async () => {
    try {
      const response = await entregaProductoApi.update(entrega.id, {
        chofer_id: null as any,
      })

      if (response.error) {
        message.error(response.error.message || 'Error al liberar entrega')
        return
      }

      message.info('Entrega liberada — ahora todos los despachadores pueden verla')
      setModalDespachoOpen(false)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      if (onRefetch) onRefetch()
    } catch (error) {
      console.error('Error al liberar entrega:', error)
      message.error('Error al liberar la entrega')
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

      <ModalMarcarEntregada
        open={modalMarcarOpen}
        onClose={() => setModalMarcarOpen(false)}
        entrega={entrega}
        onSuccess={onSuccess}
      />

      <ModalEntregarParcial
        open={modalParcialOpen}
        onClose={() => setModalParcialOpen(false)}
        entrega={entrega}
        onSuccess={onSuccess}
      />

      {/* Modal de Despacho (ticket + botones de acción) */}
      <ModalDespachoEntrega
        open={modalDespachoOpen}
        onClose={() => setModalDespachoOpen(false)}
        onDespachar={handleDespachar}
        onDespacharMasTarde={handleDespacharMasTarde}
        onDespacharParcial={() => {
          setModalDespachoOpen(false)
          setModalParcialOpen(true)
        }}
        onDespacharRestante={() => {
          setModalDespachoOpen(false)
          handleAbrirRestante()
        }}
        onCambiarTipoEntrega={handleCambiarTipoEntrega}
        tieneRestante={tieneRestante}
        loadingRestante={loadingRestante}
        entrega={entrega}
      />

      {/* Modal de Confirmar Entrega */}
      <ModalConfirmarEntrega
        open={modalConfirmarOpen}
        onClose={() => setModalConfirmarOpen(false)}
        onConfirmar={handleEntregar}
        entrega={entrega}
        loading={loading}
      />

      {/* Modal Entregar Restante: reusa el flujo de mis-ventas */}
      <ModalEntregarVenta
        open={modalRestanteOpen}
        setOpen={(open) => {
          setModalRestanteOpen(open)
          if (!open) {
            // refrescar la tabla cuando se cierre el modal (puede haberse creado entrega)
            queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
            if (onRefetch) onRefetch()
          }
        }}
        venta={ventaCompleta}
      />

      {/* Modal de selección con las 3 opciones (EnTienda / Domicilio / Parcial)
          — REUSADO de mis-ventas/crear-venta. Se abre desde el botón
          "Cambiar tipo entrega" del ModalDespachoEntrega. */}
      <ModalSeleccionarTipoDespacho
        open={modalSeleccionarTipoOpen}
        setOpen={setModalSeleccionarTipoOpen}
        onSelectTipo={handleSelectTipoDespacho}
      />
    </div>
  )
}
