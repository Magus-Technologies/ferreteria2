'use client'

import { useState } from 'react'
import { FaFilePdf, FaEdit, FaCheckCircle, FaBan, FaTrash, FaCloudUploadAlt, FaFileCode, FaDownload, FaSyncAlt, FaRedo } from 'react-icons/fa'
import { Dropdown, type MenuProps } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import useApp from 'antd/es/app/useApp'
import ButtonBase from '~/components/buttons/button-base'
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

  const handleConsultarEstado = async () => {
    setLoading(true)
    try {
      const response = await guiaRemisionApi.consultarEstado(guia.id)

      if (response.error) {
        message.error(response.error.message || 'Error al consultar el estado en SUNAT')
        return
      }

      const estado = response.data?.data?.estado
      if (estado === 'ACEPTADO') {
        message.success('SUNAT confirmó la guía: ACEPTADA')
      } else {
        message.info(response.data?.data?.mensaje || 'SUNAT todavía está procesando el ticket')
      }

      queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })

      if (onRefetch) {
        onRefetch()
      }
    } catch (error) {
      console.error('Error al consultar estado en SUNAT:', error)
      message.error('Error al consultar el estado en SUNAT')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerarXml = () => {
    modal.confirm({
      title: 'Regenerar XML de la guía',
      content: `Se volverá a generar el XML y el QR de ${guia.serie || 'T001'}-${guia.numero || '0'} con los datos actuales. ¿Continuar?`,
      okText: 'Sí, regenerar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setLoading(true)
        try {
          const response = await guiaRemisionApi.regenerarXml(guia.id)

          if (response.error) {
            message.error(response.error.message || 'Error al regenerar el XML')
            return
          }

          message.success('XML regenerado correctamente')
          queryClient.invalidateQueries({ queryKey: [QueryKeys.GUIAS_REMISION] })

          if (onRefetch) {
            onRefetch()
          }
        } catch (error) {
          console.error('Error al regenerar XML:', error)
          message.error('Error al regenerar el XML')
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
  const esElectronica = guia.tipo_guia !== 'FISICA'
  const sunatEstado = guia.sunat_estado

  // Menú de acciones, con el MISMO criterio de visibilidad que tenían los
  // botones sueltos: cada ítem se agrega solo si corresponde al estado de la
  // guía, así el dropdown nunca muestra una acción inválida.
  const menuItems: MenuProps['items'] = [
    {
      key: 'ver-pdf',
      label: (
        <span className="flex items-center gap-2">
          <FaFilePdf className="text-red-600" /> Ver PDF
        </span>
      ),
      onClick: handleVerPDF,
    },
  ]

  if (estado === 'BORRADOR') {
    menuItems.push(
      {
        key: 'editar',
        label: (
          <span className="flex items-center gap-2">
            <FaEdit className="text-blue-600" /> Editar
          </span>
        ),
        onClick: handleEditar,
      },
      {
        key: 'emitir',
        label: (
          <span className="flex items-center gap-2">
            <FaCheckCircle className="text-green-600" /> Emitir
          </span>
        ),
        onClick: handleEmitir,
      },
      {
        key: 'eliminar',
        label: (
          <span className="flex items-center gap-2">
            <FaTrash className="text-red-600" /> Eliminar
          </span>
        ),
        onClick: handleEliminar,
      },
    )
  }

  if (estado === 'EMITIDA') {
    if (esElectronica && guia.sunat_xml_path) {
      menuItems.push({
        key: 'ver-xml',
        label: (
          <span className="flex items-center gap-2">
            <FaFileCode className="text-green-600" /> Ver XML
          </span>
        ),
        onClick: handleVerXML,
      })
    }

    if (esElectronica && (guia.sunat_cdr_xml || guia.sunat_cdr_path)) {
      menuItems.push({
        key: 'descargar-cdr',
        label: (
          <span className="flex items-center gap-2">
            <FaDownload className="text-blue-600" /> Descargar CDR
          </span>
        ),
        onClick: handleDescargarCDR,
      })
    }

    if (esElectronica && (!sunatEstado || sunatEstado === 'RECHAZADO' || sunatEstado === 'OBSERVADO')) {
      menuItems.push({
        key: 'enviar-sunat',
        label: (
          <span className="flex items-center gap-2">
            <FaCloudUploadAlt className="text-purple-600" /> Enviar a SUNAT
          </span>
        ),
        onClick: handleEnviarSunat,
      })
    }

    // Solo mientras SUNAT no la tenga: aceptada, el XML vigente es el que ella
    // selló; pendiente, hay un ticket en curso.
    if (esElectronica && sunatEstado !== 'ACEPTADO' && sunatEstado !== 'PENDIENTE') {
      menuItems.push({
        key: 'regenerar-xml',
        label: (
          <span className="flex items-center gap-2">
            <FaRedo className="text-amber-600" /> Regenerar XML
          </span>
        ),
        onClick: handleRegenerarXml,
      })
    }

    if (esElectronica && sunatEstado === 'PENDIENTE') {
      menuItems.push({
        key: 'consultar-sunat',
        label: (
          <span className="flex items-center gap-2">
            <FaSyncAlt className="text-purple-600" /> Consultar estado SUNAT
          </span>
        ),
        onClick: handleConsultarEstado,
      })
    }

    menuItems.push({
      key: 'anular',
      label: (
        <span className="flex items-center gap-2">
          <FaBan className="text-orange-600" /> Anular
        </span>
      ),
      onClick: handleAnular,
    })
  }

  return (
    <div className="flex items-center justify-center h-full">
      <ConfigurableElement
        componentId="mis-guias.dropdown-acciones"
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
            // `!py-0` por la fila compacta de 28px (ver table-base): con el
            // padding que trae `size="md"` el botón mide ~32px y se recorta.
            className="flex items-center justify-center !px-2 !py-0"
            title="Acciones"
            disabled={loading}
          >
            <MoreOutlined style={{ fontSize: '18px' }} />
          </ButtonBase>
        </Dropdown>
      </ConfigurableElement>
    </div>
  )
}
