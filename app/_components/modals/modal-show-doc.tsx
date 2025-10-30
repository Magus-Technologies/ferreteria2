import { Modal, Tooltip } from 'antd'
import { cloneElement } from 'react'
import { FaDownload, FaShareNodes } from 'react-icons/fa6'
import ButtonBase from '~/components/buttons/button-base'
import { useJSXToPdf } from '~/hooks/use-react-to-pdf'
import { classOkButtonModal } from '~/lib/clases'

interface ModalEntradaStockProps {
  open: boolean
  setOpen: (open: boolean) => void
  nro_doc: string
  children: React.ReactNode
}
export default function ModalShowDoc({
  open,
  setOpen,
  nro_doc,
  children,
}: ModalEntradaStockProps) {
  const title = `Documento Nro: ${nro_doc}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childrenWithProps = cloneElement(children as React.ReactElement<any>, {
    show_logo_html: true,
  })

  const { download, print, share } = useJSXToPdf({
    jsx: <>{children}</>,
    name: nro_doc,
  })
  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={
        <div className='flex items-center gap-3'>
          {title}
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
      <div className='border rounded-xl' style={{ width: 595, zoom: 1.5 }}>
        {childrenWithProps}
      </div>
    </Modal>
  )
}
