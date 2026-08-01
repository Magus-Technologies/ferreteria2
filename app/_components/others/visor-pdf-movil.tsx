'use client'

import { useEffect, useRef, useState } from 'react'
import { Spin } from 'antd'

/**
 * Visor de PDF para celular.
 *
 * Los navegadores móviles no renderizan PDFs dentro de un <iframe>/<embed>, así
 * que acá se dibuja cada página sobre un <canvas> con pdf.js — la misma librería
 * que usa Firefox como visor. Es la única forma de mostrar el documento sin sacar
 * al usuario de la aplicación.
 *
 * `pdfjs-dist` se importa de forma dinámica: pesa bastante y solo hace falta
 * cuando realmente se abre un PDF en el celular, así no entra al bundle inicial.
 */
export default function VisorPdfMovil({
  url,
  onError,
}: {
  url: string
  /** Se llama si el PDF no se pudo dibujar, para que el caller muestre su fallback. */
  onError: () => void
}) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const [cargando, setCargando] = useState(true)

  // En un ref para no re-disparar el efecto si el caller redefine la función.
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    let cancelado = false
    // `destroy()` vive en la tarea de carga (aborta descargas y baja el worker),
    // no en el documento — el PDFDocumentProxy solo expone `cleanup()`.
    let tarea: { destroy: () => Promise<void> } | null = null

    const render = async () => {
      setCargando(true)
      try {
        const pdfjs = await import('pdfjs-dist')

        // El worker se resuelve como asset del bundler. Si esto falla, el catch
        // de abajo avisa al caller en vez de dejar el modal en blanco.
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const tareaCarga = pdfjs.getDocument({ url })
        tarea = tareaCarga
        const doc = await tareaCarga.promise
        if (cancelado) return

        const contenedor = contenedorRef.current
        if (!contenedor) return
        contenedor.innerHTML = ''

        const anchoDisponible = contenedor.clientWidth || 320
        // En pantallas retina hay que dibujar a mayor resolución o el texto se
        // ve borroso. Se limita a 2x para no reventar la memoria del teléfono.
        const densidad = Math.min(window.devicePixelRatio || 1, 2)

        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelado) return
          const pagina = await doc.getPage(n)
          const base = pagina.getViewport({ scale: 1 })
          const viewport = pagina.getViewport({
            scale: (anchoDisponible / base.width) * densidad,
          })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.style.display = 'block'
          canvas.style.background = '#fff'
          canvas.style.marginBottom = '8px'
          canvas.style.borderRadius = '4px'
          contenedor.appendChild(canvas)

          // En pdfjs 6 se pasa el canvas; `canvasContext` quedó deprecado.
          await pagina.render({ canvas, viewport }).promise
          // Primera página lista: se saca el spinner y el resto va apareciendo.
          if (n === 1 && !cancelado) setCargando(false)
        }
      } catch (error) {
        console.error('No se pudo renderizar el PDF en el celular:', error)
        if (!cancelado) onErrorRef.current()
      }
    }

    render()

    return () => {
      cancelado = true
      tarea?.destroy().catch(() => { /* el documento ya no importa */ })
    }
  }, [url])

  return (
    <div className='h-full overflow-y-auto bg-gray-200 p-2'>
      {cargando && (
        <div className='flex items-center justify-center py-10'>
          <Spin />
          <span className='ml-3 text-sm text-gray-500'>Cargando documento...</span>
        </div>
      )}
      <div ref={contenedorRef} />
    </div>
  )
}
