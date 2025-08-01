import { Modal, ModalProps } from 'antd'
import FormBase, { FormBaseProps } from '../form/form-base'
import { Dispatch, SetStateAction } from 'react'

interface ModalFormProps<T> {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  modalProps?: Omit<ModalProps, 'children'>
  formProps?: Omit<FormBaseProps<T>, 'children'>
  children?: React.ReactNode
}

export default function ModalForm<T>({
  open,
  setOpen,
  modalProps,
  formProps,
  children,
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
      }}
      destroyOnHidden
      modalRender={dom => <FormBase<T> {...formProps}>{dom}</FormBase>}
    >
      {children}
    </Modal>
  )
}
