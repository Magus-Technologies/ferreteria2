import { Modal, ModalProps } from 'antd'
import FormBase, { FormBaseProps } from '../form/form-base'
import { classOkButtonModal } from '~/lib/clases'

interface ModalFormProps<T> {
  open: boolean
  setOpen: (value: boolean) => void
  modalProps?: Omit<ModalProps, 'children'>
  formProps?: Omit<FormBaseProps<T>, 'children'>
  children?: React.ReactNode
  onCancel?: () => void
}

export default function ModalForm<T>({
  open,
  setOpen,
  modalProps,
  formProps,
  children,
  onCancel,
}: ModalFormProps<T>) {
  const {
    cancelText = 'Cancelar',
    cancelButtonProps = { className: 'rounded-xl' },
    okButtonProps = {},
    ...restModalProps
  } = modalProps || {}
  const {
    htmlType = 'submit',
    className = classOkButtonModal,
    ...restOkButtonProps
  } = okButtonProps

  return (
    <Modal
      {...restModalProps}
      maskClosable={false}
      keyboard={false}
      open={open}
      cancelText={cancelText}
      cancelButtonProps={cancelButtonProps}
      okButtonProps={{
        htmlType,
        className,
        ...restOkButtonProps,
      }}
      onCancel={() => {
        setOpen(false)
        formProps?.form?.resetFields()
        onCancel?.()
      }}
      destroyOnHidden
      modalRender={dom => <FormBase<T> {...formProps}>{dom}</FormBase>}
    >
      {children}
    </Modal>
  )
}
