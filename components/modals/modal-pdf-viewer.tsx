'use client'

import { Modal, Tooltip, message as antdMessage } from 'antd'
import { FaDownload, FaPrint } from 'react-icons/fa6'
import { pdf } from '@react-pdf/renderer'
import { cloneElement, useEffect, type ReactElement } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'

interface ModalPdfViewerProps {
  open: boolean
  onClose: () => void
  document: ReactElement<any>
  fileName: string
  title?: string
}

export default function ModalPdfViewer({
  open,
  onClose,
  document: pdfDocument,
  fileName,
  title = 'Ver Documento',
}: ModalPdfViewerProps) {
  // Clonar el documento inyectando show_logo_html=true para la vista previa HTML
  const childrenWithProps = cloneElement(pdfDocument as React.ReactElement<any>, {
    show_logo_html: true,
  })

  const handleDownload = async () => {
    try {
      const blob = await pdf(pdfDocument as any).toBlob()
      const url = URL.createObjectURL(blob)
      const link = globalThis.document.createElement('a')
      link.href = url
      link.download = `${fileName}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      antdMessage.success('PDF descargado exitosamente')
    } catch (error) {
      console.error('Error descargando PDF:', error)
      antdMessage.error('Error al descargar el PDF')
    }
  }

  const handlePrint = async () => {
    try {
      const blob = await pdf(pdfDocument as any).toBlob()
      const url = URL.createObjectURL(blob)
      const iframe = globalThis.document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      globalThis.document.body.appendChild(iframe)

      iframe.onload = () => {
        const iframeWindow = iframe.contentWindow
        if (!iframeWindow) return

        const cleanup = () => {
          URL.revokeObjectURL(url)
          iframe.remove()
        }

        iframeWindow.onafterprint = cleanup
        iframeWindow.focus()
        iframeWindow.print()
      }
    } catch (error) {
      console.error('Error imprimiendo PDF:', error)
      antdMessage.error('Error al imprimir el PDF')
    }
  }

  // Suprimir warnings de @react-pdf/renderer al renderizar en el navegador
  useEffect(() => {
    if (!open) return

    const originalError = console.error
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('is using incorrect casing') ||
          args[0].includes('Use PascalCase for React components') ||
          args[0].includes('is unrecognized in this browser') ||
          args[0].includes('If you meant to render a React component'))
      ) {
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [open])

  return (
    <Modal
      centered
      width={900}
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={
        <div className="flex flex-col gap-2">
          <div className="text-base font-semibold">{title}</div>
          <div className="flex items-center gap-2 justify-end">
            <Tooltip title="Descargar PDF">
              <ButtonBase
                onClick={handleDownload}
                color="danger"
                size="md"
                className="!px-3"
              >
                <FaDownload />
              </ButtonBase>
            </Tooltip>
            <Tooltip title="Imprimir">
              <ButtonBase
                onClick={handlePrint}
                color="success"
                size="md"
                className="!px-3"
              >
                <FaPrint />
              </ButtonBase>
            </Tooltip>
          </div>
        </div>
      }
      okText="Cerrar"
      onOk={onClose}
      cancelButtonProps={{ style: { display: 'none' } }}
      okButtonProps={{
        className: classOkButtonModal,
      }}
      onCancel={onClose}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
      <div
        className="border rounded-xl overflow-y-auto custom-scrollbar mx-auto bg-white"
        style={{
          width: '100%',
          maxHeight: '80vh',
          zoom: 1,
          padding: '40px',
          boxSizing: 'border-box',
        }}
      >
        {childrenWithProps}
      </div>
    </Modal>
  )
}
