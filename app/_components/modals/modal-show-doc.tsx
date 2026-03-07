import { Modal, Tooltip, Input, Spin, message as antdMessage } from 'antd'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { FaDownload, FaShareNodes, FaPrint } from 'react-icons/fa6'
import { HiClipboardDocument } from 'react-icons/hi2'
import { MdEmail } from 'react-icons/md'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { TipoDocumento } from '~/store/store-configuracion-impresion'
import ButtonConfiguracionImpresion from '~/components/buttons/button-configuracion-impresion'
import ModalConfiguracionImpresion from '~/components/modals/modal-configuracion-impresion'
import { cajaApi } from '~/lib/api/caja'
import { cierreCajaApi } from '~/lib/api/cierre-caja'
import { useQzPrint } from '~/hooks/use-qz-print'
import ModalSeleccionImpresora from './modal-seleccion-impresora'
import type { TipoFormato } from '~/store/store-impresora'
import { pdf } from '@react-pdf/renderer'
import { compartir } from '~/hooks/use-share'

interface ModalEntradaStockProps {
  open: boolean
  setOpen: (open: boolean) => void
  nro_doc: string
  children: React.ReactNode
  setEsTicket?: Dispatch<SetStateAction<boolean>>
  esTicket?: boolean
  tipoDocumento?: TipoDocumento
  aperturaId?: string | number
  cierreId?: string | number
}
export default function ModalShowDoc({
  open,
  setOpen,
  nro_doc,
  children,
  setEsTicket,
  esTicket = false,
  tipoDocumento,
  aperturaId,
  cierreId,
}: ModalEntradaStockProps) {
  const title = `Documento Nro: ${nro_doc}`
  const [openConfigModal, setOpenConfigModal] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailDestino, setEmailDestino] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [openImpresoraModal, setOpenImpresoraModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const formato: TipoFormato = esTicket ? 'ticket' : 'a4'

  // Ref para mantener el children actual sin causar re-renders
  const childrenRef = useRef<React.ReactNode>(children)
  childrenRef.current = children

  const handleOpenConfig = () => {
    setOpenConfigModal(true)
  }

  // QZ Tray - impresion directa
  const qz = useQzPrint({
    jsx: <>{children}</>,
    name: nro_doc,
    formato,
  })

  // Generar PDF blob y crear URL para el iframe
  const generarPdf = async () => {
    const currentChildren = childrenRef.current
    if (!currentChildren || !open) return
    setLoading(true)
    try {
      const blob = await pdf(<>{currentChildren}</>).toBlob()
      const url = URL.createObjectURL(blob)
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } catch (err) {
      console.error('Error generando PDF:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generar PDF cuando se abre el modal o cambia el formato (ticket/A4)
  useEffect(() => {
    if (open) {
      generarPdf()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, esTicket])

  // Limpiar URL al cerrar
  useEffect(() => {
    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Obtener blob del PDF actual
  const getPdfBlob = async () => {
    return await pdf(<>{childrenRef.current}</>).toBlob()
  }

  // Descargar PDF
  const handleDownload = async () => {
    const blob = await getPdfBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${nro_doc}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Compartir
  const handleShare = async () => {
    try {
      const blob = await getPdfBlob()
      compartir({ blob, fileName: `${nro_doc}.pdf` })
    } catch (err) {
      console.error('Error al compartir:', err)
    }
  }

  // Imprimir con QZ Tray
  const handlePrint = async () => {
    const imprimioDirecto = await qz.imprimirDefault()
    if (!imprimioDirecto) {
      await qz.listarImpresoras()
      setOpenImpresoraModal(true)
    }
  }

  const handleOpenImpresoraModal = async () => {
    await qz.listarImpresoras()
    setOpenImpresoraModal(true)
  }

  // Funcion para enviar email
  const handleSendEmail = async () => {
    if (!emailDestino || !emailDestino.includes('@')) {
      antdMessage.error('Por favor ingresa un email valido')
      return
    }

    setSendingEmail(true)
    try {
      const pdfBlob = await getPdfBlob()

      if (aperturaId) {
        const idString = typeof aperturaId === 'number' ? aperturaId.toString() : aperturaId
        await cajaApi.enviarTicketAperturaEmail(idString, emailDestino, pdfBlob)
        antdMessage.success('Ticket de apertura enviado exitosamente')
      } else if (cierreId) {
        const idString = typeof cierreId === 'number' ? cierreId.toString() : cierreId
        await cierreCajaApi.enviarTicketEmail(idString, emailDestino, pdfBlob)
        antdMessage.success('Ticket de cierre enviado exitosamente')
      }

      setEmailModalOpen(false)
      setEmailDestino('')
    } catch (error: any) {
      console.error('Error al enviar email:', error)
      antdMessage.error(error.message || 'Error al enviar el ticket por email')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <>
      <Modal
        centered
        width={esTicket ? 520 : 750}
        open={open}
        classNames={{ content: 'min-w-fit' }}
        title={
          <div className='flex flex-col gap-2'>
            <div className='text-base font-semibold'>{title}</div>
            <div className='flex items-center gap-2 justify-end'>
              <Tooltip title='Descargar PDF'>
                <ButtonBase
                  onClick={handleDownload}
                  color='danger'
                  size='md'
                  className='!px-3'
                >
                  <FaDownload />
                </ButtonBase>
              </Tooltip>
              <Tooltip title='Compartir'>
                <ButtonBase
                  onClick={handleShare}
                  color='success'
                  size='md'
                  className='!px-3'
                >
                  <FaShareNodes />
                </ButtonBase>
              </Tooltip>
              {(aperturaId || cierreId) && (
                <Tooltip title='Enviar por Email'>
                  <ButtonBase
                    onClick={() => setEmailModalOpen(true)}
                    color='info'
                    size='md'
                    className='!px-3'
                  >
                    <MdEmail />
                  </ButtonBase>
                </Tooltip>
              )}
              {setEsTicket && (
                <Tooltip title='Cambiar modelo'>
                  <ButtonBase
                    onClick={() => setEsTicket(prev => !prev)}
                    color='warning'
                    size='md'
                    className='!px-3'
                  >
                    <HiClipboardDocument />
                  </ButtonBase>
                </Tooltip>
              )}
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
              {tipoDocumento && (
                <ButtonConfiguracionImpresion
                  tipoDocumento={tipoDocumento}
                  onClick={handleOpenConfig}
                />
              )}
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
        okButtonProps={{
          className: classOkButtonModal,
        }}
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
              title={title}
            />
          ) : (
            <div className='flex items-center justify-center h-full text-gray-400'>
              No se pudo generar la vista previa
            </div>
          )}
        </div>
      </Modal>

      {/* Modal para ingresar email */}
      <Modal
        title="Enviar Ticket por Email"
        open={emailModalOpen}
        onOk={handleSendEmail}
        onCancel={() => {
          setEmailModalOpen(false)
          setEmailDestino('')
        }}
        okText="Enviar"
        cancelText="Cancelar"
        confirmLoading={sendingEmail}
        okButtonProps={{ className: classOkButtonModal }}
        cancelButtonProps={{ className: 'rounded-xl' }}
      >
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">
            Email de destino:
          </label>
          <Input
            type="email"
            placeholder="ejemplo@correo.com"
            value={emailDestino}
            onChange={(e) => setEmailDestino(e.target.value)}
            onPressEnter={handleSendEmail}
            autoFocus
          />
        </div>
      </Modal>

      {tipoDocumento && (
        <ModalConfiguracionImpresion
          open={openConfigModal}
          setOpen={setOpenConfigModal}
          tipoDocumento={tipoDocumento}
        />
      )}

      <ModalSeleccionImpresora
        open={openImpresoraModal}
        setOpen={setOpenImpresoraModal}
        impresoras={qz.impresoras}
        cargando={qz.cargando}
        imprimiendo={qz.imprimiendo}
        formato={formato}
        onImprimir={qz.guardarYImprimir}
        onRefrescar={qz.listarImpresoras}
      />
    </>
  )
}
