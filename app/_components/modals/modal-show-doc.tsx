import { Modal, Tooltip } from 'antd'
import { cloneElement, Dispatch, SetStateAction, useEffect, useState } from 'react'
import { FaDownload, FaShareNodes } from 'react-icons/fa6'
import { HiClipboardDocument } from 'react-icons/hi2'
import ButtonBase from '~/components/buttons/button-base'
import { useJSXToPdf } from '~/hooks/use-react-to-pdf'
import { classOkButtonModal } from '~/lib/clases'
import { TipoDocumento } from '~/store/store-configuracion-impresion'
import ButtonConfiguracionImpresion from '~/components/buttons/button-configuracion-impresion'
import ModalConfiguracionImpresion from '~/components/modals/modal-configuracion-impresion'

interface ModalEntradaStockProps {
  open: boolean
  setOpen: (open: boolean) => void
  nro_doc: string
  children: React.ReactNode
  setEsTicket?: Dispatch<SetStateAction<boolean>>
  esTicket?: boolean
  tipoDocumento?: TipoDocumento
}
export default function ModalShowDoc({
  open,
  setOpen,
  nro_doc,
  children,
  setEsTicket,
  esTicket = false,
  tipoDocumento,
}: ModalEntradaStockProps) {
  const title = `Documento Nro: ${nro_doc}`
  const [openConfigModal, setOpenConfigModal] = useState(false)

  // Solo cargar configuraciones cuando se abre el modal de configuración
  const handleOpenConfig = () => {
    setOpenConfigModal(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childrenWithProps = cloneElement(children as React.ReactElement<any>, {
    show_logo_html: true,
  })

  const { download, print, share } = useJSXToPdf({
    jsx: <>{children}</>,
    name: nro_doc,
  })
  
  // Suprimir warnings de @react-pdf/renderer sobre casing de elementos
  // Estos warnings son causados por la librería al renderizar en el navegador para preview
  // y no afectan la generación del PDF real
  useEffect(() => {
    if (!open) return
    
    const originalError = console.error
    console.error = (...args: any[]) => {
      // Filtrar warnings específicos de @react-pdf/renderer sobre casing
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('is using incorrect casing') ||
         args[0].includes('Use PascalCase for React components'))
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
              {tipoDocumento && (
                <ButtonConfiguracionImpresion
                  tipoDocumento={tipoDocumento}
                  onClick={handleOpenConfig}
                />
              )}
            </div>
          </div>
        }
        okText={'Imprimir'}
        onOk={print}
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

      {tipoDocumento && (
        <ModalConfiguracionImpresion
          open={openConfigModal}
          setOpen={setOpenConfigModal}
          tipoDocumento={tipoDocumento}
        />
      )}
    </>
  )
}
