'use client'

import { useState } from 'react'
import { FaFilePdf, FaEdit, FaCheckCircle, FaBan, FaTrash } from 'react-icons/fa'
import { Button, Space, Modal } from 'antd'
import useApp from 'antd/es/app/useApp'
import { guiaRemisionApi } from '~/lib/api/guia-remision'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useRouter } from 'next/navigation'

interface CellAccionesGuiaProps {
  guia?: any
  onRefetch?: () => void
}

export default function CellAccionesGuia({ guia, onRefetch }: CellAccionesGuiaProps) {
  const [loading, setLoading] = useState(false)
  const { message, modal } = useApp()
  const queryClient = useQueryClient()
  const router = useRouter()

  if (!guia) return null

  const handleVerPDF = () => {
    message.info('Función de PDF en desarrollo')
    console.log('Ver PDF:', guia)
  }

  const handleEditar = () => {
    router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?guia_id=${guia.id}`)
  }

  const handleEmitir = () => {
    modal.confirm({
      title: '¿Emitir guía de remisión?',
      content: 'Una vez emitida, la guía no podrá ser editada. ¿Desea continuar?',
      okText: 'Sí, emitir',
      cancelText: 'Cancelar',
      onOk: async () => {
        setLoading(true)
        try {
          const response = await guiaRemisionApi.emitir(guia.id)

          if (response.error) {
            message.error(response.error.message || 'Error al emitir guía')
            return
          }

          message.success('Guía emitida exitosamente')
          
          // Invalidar caché
          queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })
          
          if (onRefetch) {
            onRefetch()
          }
        } catch (error) {
          console.error('Error al emitir guía:', error)
          message.error('Error al emitir guía')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const handleAnular = () => {
    let motivoAnulacion = ''

    modal.confirm({
      title: '¿Anular guía de remisión?',
      content: (
        <div>
          <p className='mb-2'>Esta acción revertirá el stock si la guía afectó inventario.</p>
          <textarea
            className='w-full border rounded p-2 mt-2'
            rows={3}
            placeholder='Motivo de anulación (mínimo 10 caracteres)...'
            onChange={(e) => (motivoAnulacion = e.target.value)}
          />
        </div>
      ),
      okText: 'Sí, anular',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!motivoAnulacion || motivoAnulacion.length < 10) {
          message.error('Debe especificar un motivo de al menos 10 caracteres')
          return Promise.reject()
        }

        setLoading(true)
        try {
          const response = await guiaRemisionApi.anular(guia.id, {
            motivo_anulacion: motivoAnulacion,
          })

          if (response.error) {
            message.error(response.error.message || 'Error al anular guía')
            return
          }

          message.success('Guía anulada exitosamente')
          
          // Invalidar caché
          queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })
          
          if (onRefetch) {
            onRefetch()
          }
        } catch (error) {
          console.error('Error al anular guía:', error)
          message.error('Error al anular guía')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const handleEliminar = () => {
    modal.confirm({
      title: '¿Eliminar guía de remisión?',
      content: 'Esta acción no se puede deshacer. ¿Desea continuar?',
      okText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(true)
        try {
          const response = await guiaRemisionApi.delete(guia.id)

          if (response.error) {
            message.error(response.error.message || 'Error al eliminar guía')
            return
          }

          message.success('Guía eliminada exitosamente')
          
          // Invalidar caché
          queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })
          
          if (onRefetch) {
            onRefetch()
          }
        } catch (error) {
          console.error('Error al eliminar guía:', error)
          message.error('Error al eliminar guía')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const estado = guia.estado

  return (
    <Space size="small" className="flex items-center justify-center h-full">
      <ConfigurableElement
        componentId="mis-guias.boton-ver-pdf"
        label="Botón Ver PDF"
        noFullWidth
      >
        <Button
          type="link"
          size="small"
          icon={<FaFilePdf />}
          onClick={handleVerPDF}
          title="Ver PDF"
          className="text-red-600"
        />
      </ConfigurableElement>
      
      {estado === 'BORRADOR' && (
        <>
          <ConfigurableElement
            componentId="mis-guias.boton-editar"
            label="Botón Editar"
            noFullWidth
          >
            <Button
              type="link"
              size="small"
              icon={<FaEdit />}
              onClick={handleEditar}
              loading={loading}
              title="Editar"
              className="text-blue-600"
            />
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-guias.boton-emitir"
            label="Botón Emitir"
            noFullWidth
          >
            <Button
              type="link"
              size="small"
              icon={<FaCheckCircle />}
              onClick={handleEmitir}
              loading={loading}
              title="Emitir"
              className="text-green-600"
            />
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-guias.boton-eliminar"
            label="Botón Eliminar"
            noFullWidth
          >
            <Button
              type="link"
              size="small"
              icon={<FaTrash />}
              onClick={handleEliminar}
              loading={loading}
              title="Eliminar"
              className="text-red-600"
            />
          </ConfigurableElement>
        </>
      )}
      
      {estado === 'EMITIDA' && (
        <ConfigurableElement
          componentId="mis-guias.boton-anular"
          label="Botón Anular"
          noFullWidth
        >
          <Button
            type="link"
            size="small"
            icon={<FaBan />}
            onClick={handleAnular}
            loading={loading}
            title="Anular"
            className="text-orange-600"
          />
        </ConfigurableElement>
      )}
    </Space>
  )
}
