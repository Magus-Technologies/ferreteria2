'use client'

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { useStoreImpresora, TipoFormato } from '~/store/store-impresora'
import { setupQzSecurity } from '~/lib/qz-security'

let qz: any = null

async function getQz() {
  if (!qz) {
    qz = (await import('qz-tray')).default
    await setupQzSecurity()
  }
  return qz
}

/**
 * Hook para imprimir múltiples PDFs como trabajos separados en QZ Tray.
 * Cada PDF se envía como un print job independiente, permitiendo que la
 * impresora térmica corte entre cada documento.
 */
export function useQzPrintMultiple(formato: TipoFormato = 'ticket') {
  const [imprimiendo, setImprimiendo] = useState(false)
  const { getImpresoraDefault } = useStoreImpresora()

  const imprimirMultiple = useCallback(
    async (pdfBlobs: Blob[]) => {
      const printerName = getImpresoraDefault(formato)
      if (!printerName) {
        message.warning('No hay impresora configurada. Selecciona una primero.')
        return false
      }

      if (pdfBlobs.length === 0) return false

      setImprimiendo(true)
      try {
        const qzInstance = await getQz()

        if (!qzInstance.websocket.isActive()) {
          await qzInstance.websocket.connect()
        }

        // Enviar cada PDF como un print job separado (secuencialmente)
        for (let i = 0; i < pdfBlobs.length; i++) {
          const blob = pdfBlobs[i]
          const arrayBuffer = await blob.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          )

          const config = qzInstance.configs.create(printerName, {
            scaleContent: true,
            rasterize: true,
            margins: { top: 0, right: 0, bottom: 0, left: 0 },
          })

          await qzInstance.print(config, [
            {
              type: 'pixel',
              format: 'pdf',
              flavor: 'base64',
              data: base64,
            },
          ])
        }

        const docs = pdfBlobs.length
        message.success(
          docs === 1
            ? `Imprimiendo en: ${printerName}`
            : `Imprimiendo ${docs} documentos en: ${printerName}`
        )
        setImprimiendo(false)
        return true
      } catch (err: any) {
        console.error('Error imprimiendo múltiples docs:', err)
        message.error(err?.message || 'Error al imprimir')
        setImprimiendo(false)
        return false
      }
    },
    [formato, getImpresoraDefault]
  )

  return { imprimirMultiple, imprimiendo }
}
