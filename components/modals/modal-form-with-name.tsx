import { Form, FormInstance } from 'antd'
import TitleForm from '../form/title-form'
import ModalForm from './modal-form'
import { Dispatch, RefObject, SetStateAction, useImperativeHandle } from 'react'
import LabelBase from '../form/label-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import { MdDriveFileRenameOutline } from 'react-icons/md'
import {
  UseMutationActionProps,
  useServerMutation,
} from '~/hooks/use-server-mutation'

export interface ModalFormWithNameRef<T extends { name: string }> {
  setFieldValue: FormInstance<T>['setFieldValue']
}

type ModalFormWithNameProps<T extends { name: string }, TRes> = {
  propsUseServerMutation: UseMutationActionProps<T, TRes>
  title: string
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  children?: React.ReactNode
  ref?: RefObject<ModalFormWithNameRef<T> | null>
}

export default function FormWithName<T extends { name: string }, TRes>({
  propsUseServerMutation,
  title,
  open,
  setOpen,
  children,
  ref,
}: ModalFormWithNameProps<T, TRes>) {
  const [form] = Form.useForm<T>()
  const { onSuccess, ...restPropsMutation } = propsUseServerMutation
  const { execute, loading } = useServerMutation<T, TRes>({
    ...restPropsMutation,
    onSuccess: res => {
      setOpen(false)
      form.resetFields()
      onSuccess?.(res)
    },
  })

  useImperativeHandle(ref, () => ({
    setFieldValue: (name, value) => {
      if (form) form.setFieldValue(name, value)
    },
  }))

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
