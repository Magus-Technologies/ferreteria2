import { Form } from 'antd'
import TitleForm from '../form/title-form'
import ModalForm from './modal-form'
import { Dispatch, SetStateAction } from 'react'
import LabelBase from '../form/label-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import { MdDriveFileRenameOutline } from 'react-icons/md'
import { useServerAction } from '~/hooks/use-server-action'

export default function FormWithName<T extends { name: string }, Res>({
  title,
  open,
  setOpen,
  action,
  children,
  onSuccess,
  onError,
}: {
  title: string
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  action: (obj: T) => Promise<Res>
  children?: React.ReactNode
  onSuccess?: (res: Res) => void
  onError?: (error: unknown) => void
}) {
  const [form] = Form.useForm<T>()
  const { execute, loading } = useServerAction({
    action,
    onSuccess: res => {
      setOpen(false)
      form.resetFields()
      onSuccess?.(res)
    },
    onError,
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
