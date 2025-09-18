import { Modal, Tooltip } from 'antd'
import { FaDownload, FaShareNodes } from 'react-icons/fa6'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'

interface ModalEntradaStockProps {
  open: boolean
  setOpen: (open: boolean) => void
  title: string
  children: React.ReactNode
  handlePdf?: () => void
  handleShare?: () => void
  handlePrint?: () => void
}
export default function ModalShowDoc({
  open,
  setOpen,
  title,
  children,
  handlePdf,
  handleShare,
  handlePrint,
}: ModalEntradaStockProps) {
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
              onClick={handlePdf}
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
        </div>
      }
      okText={'Imprimir'}
      onOk={handlePrint}
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
        {children}
      </div>
    </Modal>
  )
}
