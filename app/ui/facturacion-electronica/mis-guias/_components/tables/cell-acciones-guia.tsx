'use client'

import { useState } from 'react'
import { FaFilePdf, FaEdit, FaCheckCircle, FaBan, FaTrash, FaCloudUploadAlt, FaFileCode, FaDownload } from 'react-icons/fa'
import { Button, Space, Modal } from 'antd'
import useApp from 'antd/es/app/useApp'
import { guiaRemisionApi } from '~/lib/api/guia-remision'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useRouter } from 'next/navigation'
import { useStoreModalPdfGuia } from '../../_store/store-modal-pdf-guia'

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
    useStoreModalPdfGuia.getState().openModal(guia.id)
  }

  const handleEnviarSunat = () => {
    modal.confirm({
      title: 'Enviar guia a SUNAT',
      content: `Se enviara la guia ${guia.serie || 'T001'}-${guia.numero || '0'} a SUNAT. ¿Desea continuar?`,
      okText: 'Si, enviar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setLoading(true)
        try {
          const response = await guiaRemisionApi.enviarSunat(guia.id)

          if (response.error) {
            message.error(response.error.message || 'Error al enviar a SUNAT')
            return
          }

          const modo = response.data?.data?.modo || ''
          const esBeta = modo === 'BETA' || modo === 'SIMULACION'
          message.success(`Guia enviada a SUNAT ${esBeta ? '(BETA)' : ''}`)

          queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })

          if (onRefetch) {
            onRefetch()
          }
        } catch (error) {
          console.error('Error al enviar a SUNAT:', error)
          message.error('Error al enviar guia a SUNAT')
        } finally {
          setLoading(false)
        }
      },
    })
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

  const handleVerXML = async () => {
    if (!guia.sunat_xml_path) {
      message.info('La guía aún no tiene XML generado. Emitila primero.')
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/guias-remision/${guia.id}/xml?t=${new Date().getTime()}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text.replace(/^Error al obtener XML:\s*/, '') || 'Error al obtener el XML')
      }

      const xmlText = await response.text()
      const blob = new Blob([xmlText], { type: 'application/xml' })
      const blobUrl = URL.createObjectURL(blob)

      const newWindow = window.open(blobUrl, '_blank')

      if (newWindow) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      } else {
        message.error('No se pudo abrir la ventana. Verifica que los popups no estén bloqueados.')
        URL.revokeObjectURL(blobUrl)
      }
    } catch (error) {
      console.error('Error al ver XML:', error)
      message.error(error instanceof Error ? error.message : 'Error al obtener el XML')
    }
  }

  const handleDescargarCDR = async () => {
    if (!guia.sunat_cdr_xml && !guia.sunat_cdr_path) {
      message.info('Aún no hay CDR. Enviá la guía a SUNAT primero.')
      return
    }

    try {
      message.loading({ content: 'Descargando CDR...', key: 'download-cdr', duration: 0 })

      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/guias-remision/${guia.id}/cdr?t=${new Date().getTime()}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text.replace(/^Error al obtener CDR:\s*/, '') || 'Error al descargar el CDR')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `R-${guia.serie || 'T001'}-${guia.numero || '0'}-CDR.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      message.success({ content: 'CDR descargado', key: 'download-cdr' })
    } catch (error) {
      console.error('Error al descargar CDR:', error)
      message.error({ content: error instanceof Error ? error.message : 'Error al descargar el CDR', key: 'download-cdr' })
    }
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
        <>
          {guia.tipo_guia !== 'FISICA' && guia.sunat_xml_path && (
            <ConfigurableElement
              componentId="mis-guias.boton-ver-xml"
              label="Botón Ver XML"
              noFullWidth
            >
              <Button
                type="link"
                size="small"
                icon={<FaFileCode />}
                onClick={handleVerXML}
                title="Ver XML"
                className="text-green-600"
              />
            </ConfigurableElement>
          )}
          {guia.tipo_guia !== 'FISICA' && (guia.sunat_cdr_xml || guia.sunat_cdr_path) && (
            <ConfigurableElement
              componentId="mis-guias.boton-descargar-cdr"
              label="Botón Descargar CDR"
              noFullWidth
            >
              <Button
                type="link"
                size="small"
                icon={<FaDownload />}
                onClick={handleDescargarCDR}
                title="Descargar CDR"
                className="text-blue-600"
              />
            </ConfigurableElement>
          )}
          {guia.tipo_guia !== 'FISICA' && guia.sunat_estado !== 'ACEPTADO' && (
            <ConfigurableElement
              componentId="mis-guias.boton-enviar-sunat"
              label="Boton Enviar SUNAT"
              noFullWidth
            >
              <Button
                type="link"
                size="small"
                icon={<FaCloudUploadAlt />}
                onClick={handleEnviarSunat}
                loading={loading}
                title="Enviar a SUNAT"
                className="text-purple-600"
              />
            </ConfigurableElement>
          )}
          <ConfigurableElement
            componentId="mis-guias.boton-anular"
            label="Boton Anular"
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
        </>
      )}
    </Space>
  )
}
