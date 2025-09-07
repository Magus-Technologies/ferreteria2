import { Proveedor } from '@prisma/client'
import { Form } from 'antd'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import LabelBase from '~/components/form/label-base'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import useCreateProveedor from '../../_hooks/use-create-proveedor'
import { MdEmail, MdFactory } from 'react-icons/md'
import { FaAddressCard } from 'react-icons/fa'
import { BsGeoAltFill } from 'react-icons/bs'
import { FaMobileButton } from 'react-icons/fa6'

interface ModalCreateProveedorProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: (res: Proveedor) => void
}

export type dataProveedorModalProps = Omit<
  Proveedor,
  'id' | 'created_at' | 'updated_at' | 'estado'
> & {
  estado: number
}

export default function ModalCreateProveedor({
  open,
  setOpen,
  onSuccess,
}: ModalCreateProveedorProps) {
  const [form] = Form.useForm()

  const { crearProveedorForm, loading } = useCreateProveedor({
    onSuccess: res => {
      setOpen(false)
      form.resetFields()
      onSuccess?.(res.data!)
    },
  })

  return (
    <ModalForm
      modalProps={{
        title: <TitleForm>Crear Proveedor</TitleForm>,
        className: 'min-w-[600px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Crear',
      }}
      onCancel={() => {
        form.resetFields()
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearProveedorForm,
        initialValues: {
          estado: 1,
        },
      }}
    >
      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label='Ruc:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputBase
            prefix={<FaAddressCard className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'ruc',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el RUC',
                },
              ],
            }}
            placeholder='Ruc'
          />
        </LabelBase>
        <LabelBase
          label='Estado:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <SelectEstado
            classNameIcon='text-rose-700 mx-1'
            propsForm={{
              name: 'estado',
              rules: [
                {
                  required: true,
                  message: 'Por favor, selecciona un estado',
                },
              ],
            }}
          />
        </LabelBase>
      </div>
      <LabelBase label='Razon Social:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<MdFactory className='text-rose-700 mx-1' />}
          propsForm={{
            name: 'razon_social',
            rules: [
              {
                required: true,
                message: 'Por favor, ingresa la razón social',
              },
            ],
          }}
          placeholder='Razon Social'
        />
      </LabelBase>
      <LabelBase label='Direccion:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion',
          }}
          placeholder='Direccion'
        />
      </LabelBase>
      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label='Telefono:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputBase
            prefix={<FaMobileButton className='text-cyan-600 mx-1' />}
            propsForm={{
              name: 'telefono',
            }}
            placeholder='Telefono'
          />
        </LabelBase>
        <LabelBase
          label='Email:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputBase
            prefix={<MdEmail className='text-cyan-600 mx-1' />}
            propsForm={{
              name: 'email',
            }}
            placeholder='Email'
          />
        </LabelBase>
      </div>
    </ModalForm>
  )
}
