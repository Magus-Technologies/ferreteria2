'use client'

import { ValeCompra } from '~/lib/api/vales-compra'
import { Modal, Tooltip, Spin } from 'antd'
import { useEffect, useState, useCallback, useRef } from 'react'
import { FaDownload, FaShareNodes, FaPrint } from 'react-icons/fa6'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { useQzPrint } from '~/hooks/use-qz-print'
import ModalSeleccionImpresora from '~/app/_components/modals/modal-seleccion-impresora'
import { compartir } from '~/hooks/use-share'
import { getAuthToken } from '~/lib/api'

interface ModalDocValeProps {
  open: boolean
  setOpen: (open: boolean) => void
  data: ValeCompra | null | undefined
}

export default function ModalDocVale({ open, setOpen, data }: ModalDocValeProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [openImpresoraModal, setOpenImpresoraModal] = useState(false)
  const fetchedRef = useRef<number | null>(null)

  const nombre = `vale-${data?.codigo || 'nuevo'}`

  // QZ Tray - usa el blob del backend
  const qz = useQzPrint({
    pdfBlob: pdfBlob || undefined,
    name: nombre,
    formato: 'ticket',
  })

  // Fetch PDF del backend
  const fetchPdf = useCallback(async (valeId: number) => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/vale/${valeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    })
    if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
    return await res.blob()
  }, [])

  useEffect(() => {
    if (open && data?.id && fetchedRef.current !== data.id) {
      fetchedRef.current = data.id
      setLoading(true)
      fetchPdf(data.id)
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          setPdfBlob(blob)
          setPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error cargando PDF vale:', err)
          setLoading(false)
        })
    }

    if (!open) {
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setPdfBlob(null)
      fetchedRef.current = null
    }
  }, [open, data?.id, fetchPdf])

  // Descargar PDF
  const handleDownload = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${nombre}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Compartir
  const handleShare = () => {
    if (!pdfBlob) return
    compartir({ blob: pdfBlob, fileName: `${nombre}.pdf` })
  }

  // Imprimir con QZ Tray
  const handlePrint = async () => {
    const ok = await qz.imprimirDefault()
    if (!ok) {
      await qz.listarImpresoras()
      setOpenImpresoraModal(true)
    }
  }

  const handleOpenImpresoraModal = async () => {
    await qz.listarImpresoras()
    setOpenImpresoraModal(true)
  }

  if (!data) return null

  return (
    <>
      <Modal
        centered
        width={520}
        open={open}
        classNames={{ content: 'min-w-fit' }}
        title={
          <div className='flex flex-col gap-2'>
            <div className='text-base font-semibold'>Vale: {data.codigo}</div>
            <div className='flex items-center gap-2 justify-end'>
              <Tooltip title='Descargar PDF'>
                <ButtonBase onClick={handleDownload} color='danger' size='md' className='!px-3'>
                  <FaDownload />
                </ButtonBase>
              </Tooltip>
              <Tooltip title='Compartir'>
                <ButtonBase onClick={handleShare} color='success' size='md' className='!px-3'>
                  <FaShareNodes />
                </ButtonBase>
              </Tooltip>
              <Tooltip title={qz.impresoraDefault ? `Impresora: ${qz.impresoraDefault}` : 'Seleccionar impresora'}>
                <ButtonBase
                  onClick={handleOpenImpresoraModal}
                  color={qz.impresoraDefault ? 'info' : 'default'}
                  size='md'
                  className='!px-3'
                >
                  <FaPrint />
                </ButtonBase>
              </Tooltip>
            </div>
          </div>
        }
        okText={
          qz.impresoraDefault
            ? `Imprimir (${qz.impresoraDefault.length > 20 ? qz.impresoraDefault.slice(0, 20) + '...' : qz.impresoraDefault})`
            : 'Imprimir'
        }
        onOk={handlePrint}
        confirmLoading={qz.imprimiendo}
        cancelText='Cerrar'
        cancelButtonProps={{ className: 'rounded-xl' }}
        okButtonProps={{ className: classOkButtonModal }}
        onCancel={() => setOpen(false)}
        maskClosable={false}
        keyboard={false}
        destroyOnHidden
      >
        <div
          className='border rounded-xl overflow-hidden mx-auto bg-gray-100'
          style={{ height: 650 }}
        >
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <Spin size='large' />
              <span className='ml-3 text-gray-500'>Generando vista previa...</span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              className='w-full h-full'
              style={{ border: 'none' }}
              title={`Vale ${data.codigo}`}
            />
          ) : (
            <div className='flex items-center justify-center h-full text-gray-400'>
              No se pudo generar la vista previa
            </div>
          )}
        </div>
      </Modal>

      <ModalSeleccionImpresora
        open={openImpresoraModal}
        setOpen={setOpenImpresoraModal}
        impresoras={qz.impresoras}
        cargando={qz.cargando}
        imprimiendo={qz.imprimiendo}
        formato='ticket'
        onImprimir={qz.guardarYImprimir}
        onRefrescar={qz.listarImpresoras}
      />
    </>
  )
}
