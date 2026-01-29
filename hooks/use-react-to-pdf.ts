import { JSX } from 'react'
import { compartir } from './use-share'
import { pdf } from '@react-pdf/renderer'

export function useJSXToPdf({ jsx, name }: { jsx: JSX.Element; name: string }) {
  const print = async () => {
    const blob = await pdf(jsx).toBlob()
    const blobUrl = URL.createObjectURL(blob)

    // Crear iframe oculto
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = blobUrl
    document.body.appendChild(iframe)

    iframe.onload = () => {
      const iframeWindow = iframe.contentWindow
      if (!iframeWindow) return

      // Registrar cleanup cuando termine de imprimir
      const cleanup = () => {
        URL.revokeObjectURL(blobUrl)
        iframe.remove()
      }

      iframeWindow.onafterprint = cleanup
      iframeWindow.focus()
      iframeWindow.print()
    }
  }

  async function share() {
    try {
      const blob = await pdf(jsx).toBlob()
      compartir({
        blob,
        fileName: `${name}.pdf`,
      })
    } catch (err) {
      console.error('Error al compartir el PDF', err)
    }
  }

  async function download() {
    downloadPdf({ jsx, name })
  }

  return { share, print, download }
}

export async function downloadPdf({
  jsx,
  name,
}: {
  jsx: JSX.Element
  name: string
}) {
  const blob = await pdf(jsx).toBlob()
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `${name}.pdf`
  link.click()
  URL.revokeObjectURL(blobUrl)
}
