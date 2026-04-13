import { Modal, Tooltip, Input, Spin, message as antdMessage, Select, Checkbox } from 'antd'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { FaDownload, FaPrint } from 'react-icons/fa6'
import { FaWhatsapp } from 'react-icons/fa'
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
const loadPdf = () => import('@react-pdf/renderer').then(m => m.pdf)

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
  /** URL de blob de un PDF generado por el backend. Cuando se proporciona, se usa en vez de generar con react-pdf. */
  backendPdfUrl?: string | null
  /** Indica si el backend PDF esta cargando */
  backendPdfLoading?: boolean
  /** Override del comportamiento de impresión. Si se proporciona, se usa en vez del print default. */
  onCustomPrint?: () => Promise<void>
  /** Teléfono(s) del cliente para envío por WhatsApp */
  clienteTelefonos?: string[]
  /** Mensaje de WhatsApp pre-armado con datos del documento */
  whatsappMensajeAuto?: string
  /** URL pública del PDF para incluir en el mensaje de WhatsApp */
  pdfPublicUrl?: string
  /**
   * Configuración para personalización del mensaje de WhatsApp.
   * Permite elegir columnas/campos a incluir y adjuntar URL pública del PDF.
   */
  whatsappConfig?: {
    /** URL pública del PDF (sin autenticación) para incluir en el mensaje. */
    pdfPublicUrl?: string
    /** Columnas/campos de la tabla del documento. */
    columnas?: { label: string; value: string }[]
    /** Columnas seleccionadas por defecto. Si no se pasa, se marcan todas. */
    defaultColumnas?: string[]
    /** Extras adicionales: subtotal, total, etc. */
    extras?: { label: string; value: string }[]
    /** Extras seleccionados por defecto. */
    defaultExtras?: string[]
    /**
     * Callback que construye el bloque de detalle del mensaje según las columnas y extras seleccionados.
     * Recibe los values de los checkboxes marcados y devuelve el texto a agregar al mensaje.
     */
    buildDetalle?: (columnas: string[], extras: string[]) => string
  }
  /**
   * Configuración para envío de correo electrónico.
   * Cuando se proporciona, aparece el botón de email en la barra de acciones.
   */
  emailConfig?: {
    /** Callback que ejecuta el envío real. Recibe email destino, columnas seleccionadas y mensaje personalizado. */
    onSend: (email: string, columnas: string[], mensaje: string) => Promise<void>
    /** Lista de columnas/campos que el usuario puede elegir incluir en el email. */
    columnas?: { label: string; value: string }[]
    /** Columnas marcadas por defecto. Si no se pasa, se marcan todas. */
    defaultColumnas?: string[]
    /** Email del destinatario pre-llenado (ej: correo del proveedor). */
    emailDefault?: string
    /** Mensaje por defecto pre-llenado en el textarea. */
    mensajeDefault?: string
  }
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
  backendPdfUrl,
  backendPdfLoading,
  onCustomPrint,
  clienteTelefonos,
  whatsappMensajeAuto,
  pdfPublicUrl,
  whatsappConfig,
  emailConfig,
}: ModalEntradaStockProps) {
  const title = `Documento Nro: ${nro_doc}`
  const [openConfigModal, setOpenConfigModal] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailDestino, setEmailDestino] = useState('')
  const [emailMensaje, setEmailMensaje] = useState('')
  const [emailColumnasSelec, setEmailColumnasSelec] = useState<string[]>([])
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
    jsx: backendPdfUrl ? undefined : <>{children}</>,
    backendPdfUrl,
    name: nro_doc,
    formato,
  })

  // Generar PDF blob y crear URL para el iframe
  const generarPdf = async () => {
    const currentChildren = childrenRef.current
    if (!currentChildren || !open) return
    setLoading(true)
    try {
      const pdf = await loadPdf()
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
    if (open && !backendPdfUrl && !backendPdfLoading) {
      generarPdf()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, esTicket, backendPdfUrl, backendPdfLoading])

  // Limpiar URL al cerrar
  useEffect(() => {
    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Obtener blob del PDF actual
  const getPdfBlob = async (customUrl?: string) => {
    const fetchUrl = customUrl || backendPdfUrl
    if (fetchUrl) {
      const res = await fetch(fetchUrl)
      return await res.blob()
    }
    const pdf = await loadPdf()
    return await pdf(<>{childrenRef.current}</>).toBlob()
  }

  // Helper para construir URL con parámetros de columnas
  const buildPdfUrlWithParams = (baseUrl: string, cols: string[], extras: string[]) => {
    if (!baseUrl) return ''
    const params = new URLSearchParams()
    cols.forEach(c => params.append('columnas[]', c))
    extras.forEach(e => params.append('columnas[]', e))
    const queryString = params.toString()
    if (!queryString) return baseUrl
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`
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

  // WhatsApp
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [whatsappTelefono, setWhatsappTelefono] = useState('')
  const [whatsappMensajeBase, setWhatsappMensajeBase] = useState('') // cabecera fija
  const [whatsappMensaje, setWhatsappMensaje] = useState('')         // mensaje completo (calculado)
  const [whatsappColumnasSelec, setWhatsappColumnasSelec] = useState<string[]>([])
  const [whatsappExtrasSelec, setWhatsappExtrasSelec] = useState<string[]>([])
  const [incluirUrlPdf, setIncluirUrlPdf] = useState(true)

  // Reconstruir el mensaje completo cada vez que cambian los checkboxes o la URL
  useEffect(() => {
    if (!whatsappModalOpen) return
    let msg = whatsappMensajeBase
    if (whatsappConfig?.buildDetalle) {
      const detalle = whatsappConfig.buildDetalle(whatsappColumnasSelec, whatsappExtrasSelec)
      if (detalle) msg += `\n\n${detalle}`
    }
    
    // Construir URL pública con parámetros dinámicos
    const urlBase = whatsappConfig?.pdfPublicUrl || pdfPublicUrl
    const urlPublicaConParams = buildPdfUrlWithParams(urlBase || '', whatsappColumnasSelec, whatsappExtrasSelec)

    if (incluirUrlPdf && urlPublicaConParams) {
      msg += `\n\n📎 Ver/descargar PDF:\n${urlPublicaConParams}`
    }
    setWhatsappMensaje(msg)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatsappColumnasSelec, whatsappExtrasSelec, incluirUrlPdf, whatsappModalOpen, whatsappMensajeBase, whatsappConfig, pdfPublicUrl])

  const handleOpenWhatsapp = () => {
    // Pre-llenar teléfono
    const tel = clienteTelefonos?.find(t => t && t.trim()) || ''
    setWhatsappTelefono(tel)
    // Pre-seleccionar columnas y extras
    const cols = whatsappConfig?.columnas
    setWhatsappColumnasSelec(whatsappConfig?.defaultColumnas ?? cols?.map(c => c.value) ?? [])
    const extras = whatsappConfig?.extras
    setWhatsappExtrasSelec(whatsappConfig?.defaultExtras ?? extras?.map(e => e.value) ?? [])
    // Guardar mensaje base (cabecera sin detalle)
    const base = whatsappMensajeAuto || `Hola, le comparto su documento ${nro_doc}.`
    setWhatsappMensajeBase(base)
    setWhatsappModalOpen(true)
  }

  const handleSendWhatsapp = async () => {
    const tel = whatsappTelefono.replace(/\D/g, '')
    if (!tel) {
      antdMessage.error('Ingresa un número de teléfono')
      return
    }

    const numero = tel.startsWith('51') ? tel : `51${tel}`
    const texto = encodeURIComponent(whatsappMensaje)
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
    setWhatsappModalOpen(false)
  }

  // Imprimir con QZ Tray
  const handlePrint = async () => {
    if (onCustomPrint) {
      await onCustomPrint()
      return
    }
    const imprimioDirecto = await qz.imprimirDefault()
    if (!imprimioDirecto) {
      setOpenImpresoraModal(true)
      qz.listarImpresoras()
    }
  }

  const handleOpenImpresoraModal = () => {
    setOpenImpresoraModal(true)
    qz.listarImpresoras()
  }

  // Abrir modal de email: pre-llenar defaults
  const handleOpenEmail = () => {
    setEmailDestino(emailConfig?.emailDefault ?? '')
    setEmailMensaje(emailConfig?.mensajeDefault ?? `Estimado cliente,\n\nAdjunto encontrará su documento ${nro_doc}.\n\nSaludos cordiales.`)
    const cols = emailConfig?.columnas
    const defaults = emailConfig?.defaultColumnas ?? cols?.map(c => c.value) ?? []
    setEmailColumnasSelec(defaults)
    setEmailModalOpen(true)
  }

  // Enviar email usando el callback del config
  const handleSendEmail = async () => {
    if (!emailDestino || !emailDestino.includes('@')) {
      antdMessage.error('Por favor ingresa un email válido')
      return
    }

    if (emailConfig) {
      // Modo genérico: delegar al callback del padre
      setSendingEmail(true)
      try {
        await emailConfig.onSend(emailDestino, emailColumnasSelec, emailMensaje)
        antdMessage.success('Documento enviado exitosamente por correo')
        setEmailModalOpen(false)
        setEmailDestino('')
        setEmailMensaje('')
      } catch (error: any) {
        antdMessage.error(error.message || 'Error al enviar el documento por correo')
      } finally {
        setSendingEmail(false)
      }
      return
    }

    // Modo legacy: tickets de apertura/cierre de caja
    if (!aperturaId && !cierreId) {
      antdMessage.warning('Envío de correo no configurado para este documento')
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
              <Tooltip title='Enviar por WhatsApp'>
                <ButtonBase
                  onClick={handleOpenWhatsapp}
                  color='success'
                  size='md'
                  className='!px-3'
                >
                  <FaWhatsapp />
                </ButtonBase>
              </Tooltip>
              <Tooltip title='Enviar por Correo'>
                <ButtonBase
                  onClick={handleOpenEmail}
                  color='info'
                  size='md'
                  className='!px-3'
                >
                  <MdEmail />
                </ButtonBase>
              </Tooltip>
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
          {(loading || backendPdfLoading) ? (
            <div className='flex items-center justify-center h-full'>
              <Spin size='large' />
              <span className='ml-3 text-gray-500'>Generando vista previa...</span>
            </div>
          ) : (backendPdfUrl || pdfUrl) ? (
            <iframe
              src={`${backendPdfUrl || pdfUrl}#toolbar=1&navpanes=0`}
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

      {/* Modal de email */}
      <Modal
        title={
          <div className='flex items-center gap-2'>
            <MdEmail className='text-blue-500' size={22} />
            <span className='text-lg font-semibold'>Enviar Documento por Correo</span>
          </div>
        }
        width={500}
        open={emailModalOpen}
        onOk={handleSendEmail}
        onCancel={() => {
          setEmailModalOpen(false)
          setEmailDestino('')
        }}
        okText='Enviar'
        cancelText='Cancelar'
        confirmLoading={sendingEmail}
        okButtonProps={{ className: classOkButtonModal }}
        cancelButtonProps={{ className: 'rounded-xl' }}
      >
        <div className='py-4 flex flex-col gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Correo electrónico del destinatario:
            </label>
            <Input
              type='email'
              placeholder='ejemplo@correo.com'
              value={emailDestino}
              onChange={(e) => setEmailDestino(e.target.value)}
              onPressEnter={handleSendEmail}
              autoFocus
            />
          </div>

          {/* Mensaje personalizado */}
          <div>
            <label className='block text-sm font-medium mb-2'>
              Mensaje:
            </label>
            <Input.TextArea
              rows={4}
              value={emailMensaje}
              onChange={(e) => setEmailMensaje(e.target.value)}
              maxLength={1000}
              showCount
              placeholder='Escriba el mensaje que acompañará al documento...'
            />
          </div>

          {/* Columnas seleccionables si el emailConfig las define */}
          {emailConfig?.columnas && emailConfig.columnas.length > 0 && (
            <div>
              <label className='block text-sm font-medium mb-2'>
                Información a incluir en el correo:
              </label>
              <Checkbox.Group
                value={emailColumnasSelec}
                onChange={(vals) => setEmailColumnasSelec(vals as string[])}
              >
                <div className='grid grid-cols-2 gap-y-2 gap-x-4'>
                  {emailConfig.columnas.map(col => (
                    <Checkbox key={col.value} value={col.value}>
                      {col.label}
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          )}

          <p className='text-[11px] text-gray-400'>
            Se enviará el documento PDF adjunto al correo electrónico indicado.
          </p>
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

      {/* Modal WhatsApp */}
      <Modal
        title={
          <div className='flex items-center gap-2'>
            <FaWhatsapp className='text-green-500' size={22} />
            <span className='text-lg font-semibold'>Enviar por WhatsApp</span>
          </div>
        }
        open={whatsappModalOpen}
        onOk={handleSendWhatsapp}
        onCancel={() => setWhatsappModalOpen(false)}
        okText='Enviar'
        cancelText='Cancelar'
        okButtonProps={{ className: '!bg-green-600 hover:!bg-green-700 !border-green-600 rounded-xl' }}
        cancelButtonProps={{ className: 'rounded-xl' }}
        width={550}
      >
        <div className='py-4 flex flex-col gap-4'>
          {/* Teléfono */}
          <div>
            <label className='block text-sm font-medium mb-1'>Teléfono:</label>
            {clienteTelefonos && clienteTelefonos.filter(t => t?.trim()).length > 1 ? (
              <Select
                className='w-full'
                value={whatsappTelefono}
                onChange={setWhatsappTelefono}
                options={clienteTelefonos.filter(t => t?.trim()).map(t => ({ label: t, value: t }))}
              />
            ) : (
              <Input
                placeholder='987654321'
                value={whatsappTelefono}
                onChange={e => setWhatsappTelefono(e.target.value)}
                prefix={<span className='text-gray-400'>+51</span>}
                maxLength={15}
              />
            )}
          </div>

          {/* Columnas a incluir */}
          {whatsappConfig?.columnas && whatsappConfig.columnas.length > 0 && (
            <div>
              <label className='block text-sm font-medium mb-1'>Columnas a incluir en el mensaje:</label>
              <Checkbox.Group
                value={whatsappColumnasSelec}
                onChange={(vals) => setWhatsappColumnasSelec(vals as string[])}
              >
                <div className='grid grid-cols-2 gap-y-1 gap-x-4'>
                  {whatsappConfig.columnas.map(col => (
                    <Checkbox key={col.value} value={col.value}>{col.label}</Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          )}

          {/* Extras: subtotal, total, etc. */}
          {whatsappConfig?.extras && whatsappConfig.extras.length > 0 && (
            <div>
              <label className='block text-sm font-medium mb-1'>Totales a incluir:</label>
              <Checkbox.Group
                value={whatsappExtrasSelec}
                onChange={(vals) => setWhatsappExtrasSelec(vals as string[])}
              >
                <div className='flex gap-4'>
                  {whatsappConfig.extras.map(ex => (
                    <Checkbox key={ex.value} value={ex.value}>{ex.label}</Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          )}

          {/* URL pública del PDF */}
          {(whatsappConfig?.pdfPublicUrl || pdfPublicUrl) && (
            <div className='flex items-center gap-2'>
              <Checkbox
                checked={incluirUrlPdf}
                onChange={e => setIncluirUrlPdf(e.target.checked)}
              >
                Incluir enlace al PDF en el mensaje
              </Checkbox>
              {incluirUrlPdf && (
                <span className='text-[11px] text-blue-500 truncate max-w-[200px]'>
                  {whatsappConfig?.pdfPublicUrl || pdfPublicUrl}
                </span>
              )}
            </div>
          )}

          {/* Mensaje */}
          <div>
            <label className='block text-sm font-medium mb-1'>Mensaje:</label>
            <Input.TextArea
              rows={3}
              value={whatsappMensaje}
              onChange={e => setWhatsappMensaje(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
          <p className='text-[11px] text-gray-400'>
            Se abrirá WhatsApp con el mensaje y el enlace al documento PDF.
          </p>
        </div>
      </Modal>
    </>
  )
}
