import { Form } from 'antd'
import TitleForm from '../form/title-form'
import ModalForm from './modal-form'
import { Dispatch, SetStateAction } from 'react'

export default function FormWithName<T extends { name: string }>({
  name,
  open,
  setOpen,
}: {
  name: string
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}) {
  const [form] = Form.useForm<T>()

  return (
    <ModalForm
      modalProps={{
        title: <TitleForm>Crear {name}</TitleForm>,
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: values => {
          const data = values
          console.log('🚀 ~ file: modal-form-with-name.tsx:35 ~ data:', data)
        },
      }}
    ></ModalForm>
  )
}
