'use client'

import { useState } from 'react'
import { FaMapMarkedAlt, FaTruck, FaBoxOpen, FaCheck } from 'react-icons/fa'
import { Button, Space, Tooltip } from 'antd'
import useApp from 'antd/es/app/useApp'
import { entregaProductoApi, EstadoEntrega } from '~/lib/api/entrega-producto'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import ModalDespachoEntrega from '../modals/modal-despacho-entrega'
import ModalConfirmarEntrega from '../modals/modal-confirmar-entrega'
import { useStoreEntregaSeleccionada } from './table-mis-entregas'

interface CellAccionesEntregaProps {
  entrega?: any
  onRefetch?: () => void
}

export default function CellAccionesEntrega({ entrega, onRefetch }: CellAccionesEntregaProps) {
  const [loading, setLoading] = useState(false)
  const [modalDespachoOpen, setModalDespachoOpen] = useState(false)
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false)
  const { message } = useApp()
  const queryClient = useQueryClient()
  const openPostDespacho = useStoreEntregaSeleccionada((s) => s.openPostDespacho)

  if (!entrega) return null

  const handleDespachar = async () => {
    try {
      const response = await entregaProductoApi.update(entrega.id, {
        estado_entrega: EstadoEntrega.EN_CAMINO,
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

  return (
    <>
      <Space size={4} className="flex items-center justify-center h-full">
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
          <Tooltip title="Aceptar Pedido">
            <Button
              type="text"
              size="small"
              loading={loading}
              icon={<FaCheck size={15} />}
              onClick={handleAceptar}
              className="!text-green-600 hover:!bg-green-50 !rounded-lg !w-8 !h-8 !flex !items-center !justify-center"
            />
          </Tooltip>
        )}

        {estadoEntrega === 'PENDIENTE' && (
          <ConfigurableElement
            componentId="mis-entregas.boton-en-camino"
            label="Botón En Camino"
            noFullWidth
          >
            <Tooltip title="Despachar">
              <Button
                type="text"
                size="small"
                icon={<FaTruck size={15} />}
                onClick={() => setModalDespachoOpen(true)}
                className="!text-orange-600 hover:!bg-orange-50 !rounded-lg !w-8 !h-8 !flex !items-center !justify-center"
              />
            </Tooltip>
          </ConfigurableElement>
        )}

        {estadoEntrega === 'EN_CAMINO' && (
          <ConfigurableElement
            componentId="mis-entregas.boton-entregar"
            label="Botón Entregar"
            noFullWidth
          >
            <Tooltip title="Confirmar Entrega">
              <Button
                type="text"
                size="small"
                icon={<FaBoxOpen size={15} />}
                onClick={() => setModalConfirmarOpen(true)}
                className="!text-green-600 hover:!bg-green-50 !rounded-lg !w-8 !h-8 !flex !items-center !justify-center"
              />
            </Tooltip>
          </ConfigurableElement>
        )}
      </Space>

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
    </>
  )
}
