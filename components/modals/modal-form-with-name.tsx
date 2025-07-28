import { Form } from 'antd'
import TitleForm from '../form/title-form'
import ModalForm from './modal-form'
import { Dispatch, SetStateAction } from 'react'
import LabelBase from '../form/label-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import { MdDriveFileRenameOutline } from 'react-icons/md'
import {
  UseMutationActionProps,
  useServerMutation,
} from '~/hooks/use-server-mutation'

type ModalFormWithNameProps<T extends { name: string }, Res> = {
  propsUseServerMutation: UseMutationActionProps<T, Res>
  title: string
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  children?: React.ReactNode
}

export default function FormWithName<T extends { name: string }, Res>({
  propsUseServerMutation,
  title,
  open,
  setOpen,
  children,
}: ModalFormWithNameProps<T, Res>) {
  const [form] = Form.useForm<T>()
  const { onSuccess, ...restPropsMutation } = propsUseServerMutation
  const { execute, loading } = useServerMutation<T, Res>({
    ...restPropsMutation,
    onSuccess: res => {
      setOpen(false)
      form.resetFields()
      onSuccess?.(res)
    },
  })

  return (
    <ModalForm
      modalProps={{
        title: <TitleForm>Crear {title}</TitleForm>,
        okButtonProps: { loading, disabled: loading },
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: execute,
      }}
    >
      <LabelBase label='Nombre:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          propsForm={{
            name: 'name',
            rules: [
              {
                required: true,
                message: `Por favor, ingresa el nombre`,
              },
            ],
          }}
          placeholder={`Nombre`}
          prefix={
            <MdDriveFileRenameOutline
              size={15}
              className='text-rose-700 mx-1'
            />
          }
        />
      </LabelBase>
      {children}
    </ModalForm>
  )
}
