import { Modal, Tooltip, Input, message as antdMessage } from 'antd'
import { cloneElement, Dispatch, SetStateAction, useEffect, useState } from 'react'
import { FaDownload, FaShareNodes, FaPrint } from 'react-icons/fa6'
import { HiClipboardDocument } from 'react-icons/hi2'
import { MdEmail } from 'react-icons/md'
import ButtonBase from '~/components/buttons/button-base'
import { useJSXToPdf } from '~/hooks/use-react-to-pdf'
import { classOkButtonModal } from '~/lib/clases'
import { TipoDocumento } from '~/store/store-configuracion-impresion'
import ButtonConfiguracionImpresion from '~/components/buttons/button-configuracion-impresion'
import ModalConfiguracionImpresion from '~/components/modals/modal-configuracion-impresion'
import { cajaApi } from '~/lib/api/caja'
import { cierreCajaApi } from '~/lib/api/cierre-caja'
import { useQzPrint } from '~/hooks/use-qz-print'
import ModalSeleccionImpresora from './modal-seleccion-impresora'
import type { TipoFormato } from '~/store/store-impresora'

interface ModalEntradaStockProps {
  open: boolean
  setOpen: (open: boolean) => void
  nro_doc: string
  children: React.ReactNode
  setEsTicket?: Dispatch<SetStateAction<boolean>>
  esTicket?: boolean
  tipoDocumento?: TipoDocumento
  aperturaId?: string | number  // ID de apertura para enviar email
  cierreId?: string | number     // ID de cierre para enviar email
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

  const formato: TipoFormato = esTicket ? 'ticket' : 'a4'

  // Solo cargar configuraciones cuando se abre el modal de configuración
  const handleOpenConfig = () => {
    setOpenConfigModal(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childrenWithProps = cloneElement(children as React.ReactElement<any>, {
    show_logo_html: true,
  })

  const { download, print, share, getPdfBlob } = useJSXToPdf({
    jsx: <>{children}</>,
    name: nro_doc,
  })

  // QZ Tray - impresión directa
  const qz = useQzPrint({
    jsx: <>{children}</>,
    name: nro_doc,
    formato,
  })

  // Imprimir: si hay impresora default → directo, si no → abrir modal de selección
  const handlePrint = async () => {
    const imprimioDirecto = await qz.imprimirDefault()
    if (!imprimioDirecto) {
      // No hay impresora por defecto, cargar lista y abrir modal
      await qz.listarImpresoras()
      setOpenImpresoraModal(true)
    }
  }

  // Abrir modal de selección de impresora (para elegir/cambiar impresora)
  const handleOpenImpresoraModal = async () => {
    await qz.listarImpresoras()
    setOpenImpresoraModal(true)
  }

  // Función para enviar email
  const handleSendEmail = async () => {
    console.log('🔵 handleSendEmail llamado', { aperturaId, cierreId, emailDestino })
    
    if (!emailDestino || !emailDestino.includes('@')) {
      antdMessage.error('Por favor ingresa un email válido')
      return
    }

    setSendingEmail(true)
    try {
      console.log('🔵 Generando PDF...')
      const pdfBlob = await getPdfBlob()
      console.log('🔵 PDF generado:', pdfBlob.size, 'bytes')

      // Enviar según el tipo de documento
      if (aperturaId) {
        const idString = typeof aperturaId === 'number' ? aperturaId.toString() : aperturaId
        console.log('🔵 Enviando apertura email:', idString, emailDestino)
        await cajaApi.enviarTicketAperturaEmail(idString, emailDestino, pdfBlob)
        antdMessage.success('Ticket de apertura enviado exitosamente')
      } else if (cierreId) {
        const idString = typeof cierreId === 'number' ? cierreId.toString() : cierreId
        console.log('🔵 Enviando cierre email:', idString, emailDestino)
        await cierreCajaApi.enviarTicketEmail(idString, emailDestino, pdfBlob)
        antdMessage.success('Ticket de cierre enviado exitosamente')
      }

      setEmailModalOpen(false)
      setEmailDestino('')
    } catch (error: any) {
      console.error('❌ Error al enviar email:', error)
      antdMessage.error(error.message || 'Error al enviar el ticket por email')
    } finally {
      setSendingEmail(false)
    }
  }
  
  // Suprimir warnings de @react-pdf/renderer
  // Estos warnings son causados por la librería al renderizar en el navegador para preview
  // y no afectan la generación del PDF real
  useEffect(() => {
    if (!open) return
    
    const originalError = console.error
    console.error = (...args: any[]) => {
      // Filtrar warnings de @react-pdf/renderer
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
    <>
      <Modal
        centered
        width='fit-content'
        open={open}
        classNames={{ content: 'min-w-fit' }}
        title={
          <div className='flex flex-col gap-2'>
            <div className='text-base font-semibold'>{title}</div>
            <div className='flex items-center gap-2 justify-end'>
              <Tooltip title='Descargar PDF'>
                <ButtonBase
                  onClick={download}
                  color='danger'
                  size='md'
                  className='!px-3'
                >
                  <FaDownload />
                </ButtonBase>
              </Tooltip>
              <Tooltip title='Compartir'>
                <ButtonBase
                  onClick={share}
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
        <style>
          {`
            /* Estilos personalizados para el scrollbar */
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
          className='border rounded-xl overflow-y-auto custom-scrollbar mx-auto'
          style={{
            width: esTicket ? 226.77 : 595.28,
            maxWidth: esTicket ? 226.77 : 595.28,
            maxHeight: '500px',
            zoom: esTicket ? 1.5 : 1.2,
          }}
        >
          {childrenWithProps}
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
