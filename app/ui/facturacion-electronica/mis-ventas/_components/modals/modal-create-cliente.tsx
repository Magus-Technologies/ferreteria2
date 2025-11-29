import { Cliente } from '@prisma/client'
import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import useCreateCliente from '../../_hooks/use-create-cliente'
import FormCreateCliente from '../form/form-create-cliente'
import { useEffect } from 'react'
import { getClienteResponseProps } from '~/app/_actions/cliente'

interface ModalCreateClienteProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: (res: Cliente) => void
  dataEdit?: getClienteResponseProps
  textDefault?: string
  setTextDefault?: (text: string) => void
}

export default function ModalCreateCliente({
  open,
  setOpen,
  onSuccess,
  dataEdit,
  textDefault,
  setTextDefault,
}: ModalCreateClienteProps) {
  const [form] = Form.useForm()

  const { crearClienteForm, loading } = useCreateCliente({
    onSuccess: res => {
      setOpen(false)
      form.resetFields()
      onSuccess?.(res.data!)
    },
    dataEdit,
  })

  useEffect(() => {
    form.resetFields()
    if (dataEdit) {
      form.setFieldsValue({
        ...dataEdit,
      })
    } else {
      form.setFieldsValue({
        numero_documento: textDefault,
      })
    }
  }, [form, dataEdit, open, textDefault])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {dataEdit ? 'Editar' : 'Crear'} Cliente
          </TitleForm>
        ),
        className: 'min-w-[550px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: dataEdit ? 'Editar' : 'Crear',
      }}
      onCancel={() => {
        form.resetFields()
        setTextDefault?.('')
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearClienteForm,
      }}
    >
        <FormCreateCliente form={form} dataEdit={dataEdit} />
    </ModalForm>
  )
}
