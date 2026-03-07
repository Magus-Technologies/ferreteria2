'use client'

import { useState, useCallback, useRef } from 'react'
import { message } from 'antd'
import { pdf } from '@react-pdf/renderer'
import { JSX } from 'react'
import { useStoreImpresora, TipoFormato } from '~/store/store-impresora'
import { setupQzSecurity } from '~/lib/qz-security'

// QZ Tray no tiene tipos TypeScript, importamos dinámicamente
let qz: any = null

async function getQz() {
  if (!qz) {
    qz = (await import('qz-tray')).default
    
    // 🆕 Configurar seguridad antes de usar QZ Tray
    await setupQzSecurity()
  }
  return qz
}

interface UseQzPrintOptions {
  jsx: JSX.Element
  name: string
  formato?: TipoFormato
}

export function useQzPrint({ jsx, name, formato = 'ticket' }: UseQzPrintOptions) {
  const [impresoras, setImpresoras] = useState<string[]>([])
  const [conectado, setConectado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [imprimiendo, setImprimiendo] = useState(false)
  const conectandoRef = useRef(false)

  const { getImpresoraDefault, setImpresoraDefault } = useStoreImpresora()

  // Conectar a QZ Tray
  const conectar = useCallback(async (): Promise<boolean> => {
    if (conectandoRef.current) return false
    conectandoRef.current = true
    setCargando(true)

    try {
      const qzInstance = await getQz()

      // Si ya está conectado, no reconectar
      if (qzInstance.websocket.isActive()) {
        setConectado(true)
        setCargando(false)
        conectandoRef.current = false
        return true
      }

      await qzInstance.websocket.connect()
      setConectado(true)
      setCargando(false)
      conectandoRef.current = false
      return true
    } catch (err: any) {
      console.error('Error conectando QZ Tray:', err)
      setConectado(false)
      setCargando(false)
      conectandoRef.current = false

      if (err?.message?.includes('Unable to establish')) {
        message.error(
          'No se pudo conectar con QZ Tray. Verifica que esté ejecutándose en la bandeja del sistema.'
        )
      }
      return false
    }
  }, [])

  // Listar impresoras del sistema
  const listarImpresoras = useCallback(async (): Promise<string[]> => {
    try {
      const ok = await conectar()
      if (!ok) return []

      const qzInstance = await getQz()
      const lista: string[] = await qzInstance.printers.find()
      setImpresoras(lista)
      return lista
    } catch (err) {
      console.error('Error listando impresoras:', err)
      message.error('Error al obtener la lista de impresoras')
      return []
    }
  }, [conectar])

  // Imprimir PDF a una impresora específica
  const imprimirEn = useCallback(
    async (nombreImpresora: string) => {
      setImprimiendo(true)
      try {
        const ok = await conectar()
        if (!ok) {
          setImprimiendo(false)
          return false
        }

        const qzInstance = await getQz()

        // Generar PDF blob
        const blob = await pdf(jsx).toBlob()
        const arrayBuffer = await blob.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        )

        // Configurar impresora
        const config = qzInstance.configs.create(nombreImpresora, {
          scaleContent: true,
          rasterize: true,
          margins: { top: 0, right: 0, bottom: 0, left: 0 },
        })

        // Imprimir
        await qzInstance.print(config, [
          {
            type: 'pixel',
            format: 'pdf',
            flavor: 'base64',
            data: base64,
          },
        ])

        message.success(`Imprimiendo en: ${nombreImpresora}`)
        setImprimiendo(false)
        return true
      } catch (err: any) {
        console.error('Error imprimiendo:', err)
        message.error(err?.message || 'Error al imprimir')
        setImprimiendo(false)
        return false
      }
    },
    [conectar, jsx]
  )

  // Imprimir usando la impresora por defecto del formato
  const imprimirDefault = useCallback(async () => {
    const defaultPrinter = getImpresoraDefault(formato)
    if (!defaultPrinter) {
      return false // No hay impresora por defecto, debe abrir modal
    }
    return imprimirEn(defaultPrinter)
  }, [formato, getImpresoraDefault, imprimirEn])

  // Guardar impresora como default y luego imprimir
  const guardarYImprimir = useCallback(
    async (nombreImpresora: string) => {
      setImpresoraDefault(formato, nombreImpresora)
      return imprimirEn(nombreImpresora)
    },
    [formato, setImpresoraDefault, imprimirEn]
  )

  // Desconectar
  const desconectar = useCallback(async () => {
    try {
      const qzInstance = await getQz()
      if (qzInstance.websocket.isActive()) {
        await qzInstance.websocket.disconnect()
      }
      setConectado(false)
    } catch (err) {
      console.error('Error desconectando QZ Tray:', err)
    }
  }, [])

  return {
    impresoras,
    conectado,
    cargando,
    imprimiendo,
    conectar,
    listarImpresoras,
    imprimirEn,
    imprimirDefault,
    guardarYImprimir,
    desconectar,
    impresoraDefault: getImpresoraDefault(formato),
  }
}
