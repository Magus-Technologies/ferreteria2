'use client'

import { useState } from 'react'
import { FaMapMarkedAlt, FaEye } from 'react-icons/fa'
import { Button, Space, Tooltip } from 'antd'
import useApp from 'antd/es/app/useApp'
import { entregaProductoApi, EstadoEntrega } from '~/lib/api/entrega-producto'
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

  if (!entrega) return null

  // Hay restante por entregar si alguna unidad de la venta tiene cantidad_pendiente > 0.
  const tieneRestante = (entrega.productos_entregados || []).some(
    (p: any) => Number(p?.unidad_derivada_venta?.cantidad_pendiente || 0) > 0,
  )

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

  // Mapear estados de la DB
  const estadoEntrega = entrega.estado_entrega === 'pe' ? 'PENDIENTE'
    : entrega.estado_entrega === 'ec' ? 'EN_CAMINO'
    : entrega.estado_entrega === 'en' ? 'ENTREGADO'
    : entrega.estado_entrega === 'ca' ? 'CANCELADO'
    : entrega.estado_entrega

  const tipoEntrega = entrega.tipo_entrega
  const esRecojoTienda = tipoEntrega === 'rt'
  const onSuccess = () => {
    if (onRefetch) onRefetch()
  }

  // Botón principal "Entregar" según estado actual
  const botonPrincipal = (() => {
    if (estadoEntrega === 'PENDIENTE' && esRecojoTienda) {
      return {
        label: 'Entregar',
        onClick: () => setModalMarcarOpen(true),
        configId: 'mis-entregas.boton-entregar',
      }
    }
    if (estadoEntrega === 'PENDIENTE' && !esRecojoTienda) {
      return {
        label: 'Despachar',
        onClick: () => setModalDespachoOpen(true),
        configId: 'mis-entregas.boton-en-camino',
      }
    }
    if (estadoEntrega === 'EN_CAMINO') {
      return {
        label: 'Confirmar',
        onClick: () => setModalConfirmarOpen(true),
        configId: 'mis-entregas.boton-entregar',
      }
    }
    return null
  })()

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

        {botonPrincipal && (
          <ConfigurableElement
            componentId={botonPrincipal.configId}
            label={`Botón ${botonPrincipal.label}`}
            noFullWidth
          >
            <Button
              type="primary"
              size="small"
              onClick={botonPrincipal.onClick}
              className="!bg-green-600 hover:!bg-green-700 !border-none !font-semibold"
            >
              {botonPrincipal.label}
            </Button>
          </ConfigurableElement>
        )}

        {estadoEntrega === 'PENDIENTE' && (entrega.productos_entregados?.length || 0) > 0 && (
          <Button
            type="default"
            size="small"
            onClick={() => setModalParcialOpen(true)}
            className="!border-amber-500 !text-amber-700 hover:!bg-amber-50 !font-semibold"
          >
            Parcial
          </Button>
        )}

        {tieneRestante && (
          <ConfigurableElement
            componentId="mis-entregas.boton-entregar-restante"
            label="Botón Entregar Restante"
            noFullWidth
          >
            <Button
              type="default"
              size="small"
              loading={loadingRestante}
              onClick={handleAbrirRestante}
              className="!border-purple-500 !text-purple-700 hover:!bg-purple-50 !font-semibold"
            >
              Restante
            </Button>
          </ConfigurableElement>
        )}
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

      {/* Modal de Despacho (ticket + botón despachar) */}
      <ModalDespachoEntrega
        open={modalDespachoOpen}
        onClose={() => setModalDespachoOpen(false)}
        onDespachar={handleDespachar}
        onDespacharMasTarde={handleDespacharMasTarde}
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
