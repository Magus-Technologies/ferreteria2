import { Modal, ModalProps } from 'antd'
import FormBase, { FormBaseProps } from '../form/form-base'

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
    className = 'rounded-xl !bg-emerald-500 hover:!bg-emerald-600 disabled:hover:!bg-gray-300',
    ...restOkButtonProps
  } = okButtonProps

  return (
    <Modal
      {...restModalProps}
      maskClosable={false}
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
