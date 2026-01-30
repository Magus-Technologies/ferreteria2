'use client'

import { useState } from 'react'
import { FaMapMarkedAlt, FaTruck, FaCheck } from 'react-icons/fa'
import { Button, Space } from 'antd'
import useApp from 'antd/es/app/useApp'
import { entregaProductoApi, EstadoEntrega } from '~/lib/api/entrega-producto'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface CellAccionesEntregaProps {
  entrega?: any
  onRefetch?: () => void
}

export default function CellAccionesEntrega({ entrega, onRefetch }: CellAccionesEntregaProps) {
  const [loading, setLoading] = useState(false)
  const { message } = useApp()
  const queryClient = useQueryClient()

  if (!entrega) return null

  const handleVerMapa = () => {
    // TODO: Abrir modal con mapa
    message.info('Función de mapa en desarrollo')
    console.log('Ver mapa:', entrega)
  }

  const handleEnCamino = async () => {
    setLoading(true)
    try {
      const response = await entregaProductoApi.update(entrega.id, {
        estado_entrega: EstadoEntrega.EN_CAMINO,
      })

      if (response.error) {
        message.error(response.error.message || 'Error al actualizar estado')
        return
      }

      message.success('Estado actualizado a En Camino')
      
      // Invalidar caché para refrescar la tabla
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      
      // Llamar callback si existe
      if (onRefetch) {
        onRefetch()
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      message.error('Error al actualizar estado')
    } finally {
      setLoading(false)
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
      
      // Invalidar caché para refrescar la tabla
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      
      // Llamar callback si existe
      if (onRefetch) {
        onRefetch()
      }
    } catch (error) {
      console.error('Error al completar entrega:', error)
      message.error('Error al completar entrega')
    } finally {
      setLoading(false)
    }
  }

  // Mapear estados de la DB a los que espera el componente
  const estadoEntrega = entrega.estado_entrega === 'pe' ? 'PENDIENTE' 
    : entrega.estado_entrega === 'ec' ? 'EN_CAMINO'
    : entrega.estado_entrega === 'en' ? 'ENTREGADO'
    : entrega.estado_entrega === 'ca' ? 'CANCELADO'
    : entrega.estado_entrega

  return (
    <Space size="small" className="flex items-center justify-center h-full">
      <Button
        type="link"
        size="small"
        icon={<FaMapMarkedAlt />}
        onClick={handleVerMapa}
        title="Ver Mapa"
      />
      
      {estadoEntrega === 'PENDIENTE' && (
        <Button
          type="link"
          size="small"
          icon={<FaTruck />}
          onClick={handleEnCamino}
          loading={loading}
          title="Marcar En Camino"
          className="text-blue-600"
        />
      )}
      
      {estadoEntrega === 'EN_CAMINO' && (
        <Button
          type="link"
          size="small"
          icon={<FaCheck />}
          onClick={handleEntregar}
          loading={loading}
          title="Marcar como Entregado"
          className="text-green-600"
        />
      )}
    </Space>
  )
}
