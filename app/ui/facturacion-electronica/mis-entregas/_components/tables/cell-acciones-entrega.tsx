'use client'

import { useState, useEffect } from 'react'
import { FaMapMarkedAlt, FaEye, FaTruck } from 'react-icons/fa'
import { Button, Modal, Space, Tooltip } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import { entregaProductoApi, EstadoEntrega, TipoEntrega } from '~/lib/api/entrega-producto'
import { ventaApi, type getVentaResponseProps } from '~/lib/api/venta'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import ModalDespachoEntrega from '../modals/modal-despacho-entrega'
import ModalConfirmarEntrega from '../modals/modal-confirmar-entrega'
import ModalDetallesEntregaCompleto from '../modals/modal-detalles-entrega-completo'
import ModalMarcarEntregada from '../modals/modal-marcar-entregada'
import ModalEntregarParcial from '../modals/modal-entregar-parcial'
import ModalEntregarVenta from '../../../mis-ventas/_components/modals/modal-entregar-venta'
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
  const [ventaCompleta, setVentaCompleta] = useState<getVentaResponseProps | undefined>()
  const [loadingRestante, setLoadingRestante] = useState(false)
  const { message } = useApp()
  const queryClient = useQueryClient()
  const openPostDespacho = useStoreEntregaSeleccionada((s) => s.openPostDespacho)
  const entregaSeleccionada = useStoreEntregaSeleccionada((s) => s.entrega)
  const accionTrigger = useStoreEntregaSeleccionada((s) => s.accionTrigger)
  const triggerAccion = useStoreEntregaSeleccionada((s) => s.triggerAccion)

  // Escuchar el trigger del botón principal (filter) — solo la fila seleccionada
  // responde al trigger y abre el modal correspondiente.
  useEffect(() => {
    if (!accionTrigger || !entrega) return
    if (entregaSeleccionada?.id !== entrega.id) return
    if (accionTrigger === 'despachar') setModalDespachoOpen(true)
    else if (accionTrigger === 'marcar') setModalMarcarOpen(true)
    else if (accionTrigger === 'confirmar') setModalConfirmarOpen(true)
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
    // Pasar venta_id + datos del chofer/vehículo de la entrega para pre-llenar la guía
    const params = new URLSearchParams({ venta_id: entrega.venta_id })
    if (entrega.chofer_id) params.set('chofer_id', String(entrega.chofer_id))
    if (entrega.vehiculo?.placa) params.set('vehiculo_placa', String(entrega.vehiculo.placa))
    router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?${params.toString()}`)
  }

  const handleCambiarTipoEntrega = () => {
    const tipoActual = entrega.tipo_entrega
    const nuevoTipo =
      tipoActual === TipoEntrega.RECOJO_EN_TIENDA
        ? TipoEntrega.DESPACHO
        : TipoEntrega.RECOJO_EN_TIENDA
    const labelActual =
      tipoActual === TipoEntrega.RECOJO_EN_TIENDA ? 'Recojo en Tienda' : 'Despacho a Domicilio'
    const labelNuevo =
      nuevoTipo === TipoEntrega.RECOJO_EN_TIENDA ? 'Recojo en Tienda' : 'Despacho a Domicilio'

    Modal.confirm({
      title: 'Cambiar tipo de entrega',
      content: `La entrega pasará de "${labelActual}" a "${labelNuevo}". ¿Confirmar?`,
      okText: 'Sí, cambiar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const response = await entregaProductoApi.update(entrega.id, {
            tipo_entrega: nuevoTipo,
          })
          if (response.error) {
            message.error(response.error.message || 'Error al cambiar tipo de entrega')
            return
          }
          message.success(`Tipo de entrega cambiado a ${labelNuevo}`)
          setModalDespachoOpen(false)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
          if (onRefetch) onRefetch()
        } catch (err: any) {
          message.error(err?.message || 'Error al cambiar tipo de entrega')
        }
      },
    })
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
      const response = await entregaProductoApi.update(entrega.id, {
        estado_entrega: EstadoEntrega.EN_CAMINO,
        ...(vehiculoId ? { vehiculo_id: vehiculoId } : {}),
      })

      if (response.error) {
        message.error(response.error.message || 'Error al actualizar estado')
        return
      }

      message.success('Entrega despachada correctamente')
      setModalDespachoOpen(false)

      // Abrir modal post-despacho via Zustand (sobrevive re-renders de la tabla)
      openPostDespacho(entrega)

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

  return (
    <>
      <Space size={4} className="flex items-center justify-center h-full">
        <Tooltip title="Ver Detalles">
          <Button
            type="text"
            size="small"
            icon={<FaEye size={15} />}
            onClick={() => setModalDetallesOpen(true)}
            className="!text-slate-600 hover:!bg-slate-100 !rounded-lg !w-8 !h-8 !flex !items-center !justify-center"
          />
        </Tooltip>

        <ConfigurableElement
          componentId="mis-entregas.boton-ver-mapa"
          label="Botón Ver Mapa"
          noFullWidth
        >
          <Tooltip title="Ver Mapa">
            <Button
              type="text"
              size="small"
              icon={<FaMapMarkedAlt size={15} />}
              onClick={() => openPostDespacho(entrega)}
              className="!text-blue-600 hover:!bg-blue-50 !rounded-lg !w-8 !h-8 !flex !items-center !justify-center"
            />
          </Tooltip>
        </ConfigurableElement>

        <ConfigurableElement
          componentId="mis-entregas.boton-crear-guia"
          label="Botón Crear Guía"
          noFullWidth
        >
          <Tooltip title="Crear Guía de Remisión">
            <Button
              type="text"
              size="small"
              icon={<FaTruck size={15} />}
              onClick={handleCrearGuia}
              className="!text-cyan-700 hover:!bg-cyan-50 !rounded-lg !w-8 !h-8 !flex !items-center !justify-center"
            />
          </Tooltip>
        </ConfigurableElement>

        {esPedidoExternoDisponible && (
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={handleAceptar}
            className="!bg-green-600 hover:!bg-green-700 !border-none !font-semibold"
          >
            Aceptar
          </Button>
        )}

        {/* Botones principales "Entregar/Despachar/Confirmar" se movieron arriba
            al lado de Buscar (filters-mis-entregas). El botón "Parcial" se movió
            dentro del modal de Despacho (es una variante de despachar).
            Solo aplica a la fila SELECCIONADA y se dispara desde ahí vía store. */}

        {/* "Restante" se movió dentro del modal de Despacho como opción
            adicional. "Cambiar tipo entrega" también vive ahí. */}
      </Space>

      <ModalDetallesEntregaCompleto
        open={modalDetallesOpen}
        onClose={() => setModalDetallesOpen(false)}
        entrega={entrega}
      />

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
    </>
  )
}
