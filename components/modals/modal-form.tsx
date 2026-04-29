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
    // Por default destruimos al ocultar para liberar memoria y, sobre todo,
    // para evitar que el wrap/mask del Modal quede bloqueando clicks en la
    // página después de cerrarlo (problema observado con React 19 + AntD v5).
    // Si un modal específico es muy pesado, se puede pasar destroyOnHidden=false
    // explícitamente en modalProps.
    destroyOnHidden = true,
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
      destroyOnHidden={destroyOnHidden}
      modalRender={dom => <FormBase<T> {...formProps}>{dom}</FormBase>}
    >
      {children}
    </Modal>
  )
}
