import { Proveedor, Vendedor } from '@prisma/client'
import { Form, Tabs } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import useCreateProveedor from '../../_hooks/use-create-proveedor'
import FormCreateProveedor from '../form/form-create-proveedor'
import { TabsProps } from 'antd/lib'
import FormVendedoresProveedor from '../form/form-vendedores-proveedor'
import type { Dayjs } from 'dayjs'

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
  vendedores: (Omit<Vendedor, 'id' | 'estado' | 'cumple'> & {
    estado: number
    cumple: Dayjs
  })[]
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
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Datos Proveedor',
      children: <FormCreateProveedor form={form} />,
    },
    {
      key: '2',
      label: 'Vendedores',
      children: <FormVendedoresProveedor form={form} />,
    },
  ]

  return (
    <ModalForm
      modalProps={{
        title: <TitleForm className='!pb-0'>Crear Proveedor</TitleForm>,
        className: 'min-w-[550px]',
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
      <Tabs className='min-h-[315px]' items={items} />
    </ModalForm>
  )
}
