import { Carro, Chofer, Proveedor, Vendedor } from '@prisma/client'
import { Form, Tabs } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import useCreateProveedor from '../../_hooks/use-create-proveedor'
import FormCreateProveedor from '../form/form-create-proveedor'
import { TabsProps } from 'antd/lib'
import FormVendedoresProveedor from '../form/form-vendedores-proveedor'
import type { Dayjs } from 'dayjs'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import FormCarrosProveedor from '../form/form-carros-proveedor'
import FormChoferesProveedor from '../form/form-choferes-proveedor'
import { getProveedorResponseProps } from '~/app/_actions/proveedor'

interface ModalCreateProveedorProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: (res: Proveedor) => void
  dataEdit?: getProveedorResponseProps
  textDefault?: string
  setTextDefault?: (text: string) => void
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
  carros: Pick<Carro, 'placa'>[]
  choferes: Pick<Chofer, 'dni' | 'name' | 'licencia'>[]
}

export default function ModalCreateProveedor({
  open,
  setOpen,
  onSuccess,
  dataEdit,
  textDefault,
  setTextDefault,
}: ModalCreateProveedorProps) {
  const [form] = Form.useForm()

  const { crearProveedorForm, loading } = useCreateProveedor({
    onSuccess: res => {
      setOpen(false)
      form.resetFields()
      onSuccess?.(res.data!)
    },
    dataEdit,
  })

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Datos Proveedor',
      children: <FormCreateProveedor form={form} dataEdit={dataEdit} />,
    },
    {
      key: '2',
      label: 'Vendedores',
      children: <FormVendedoresProveedor form={form} dataEdit={dataEdit} />,
    },
    {
      key: '3',
      label: 'Carros',
      children: <FormCarrosProveedor />,
    },
    {
      key: '4',
      label: 'Choferes',
      children: <FormChoferesProveedor form={form} dataEdit={dataEdit} />,
    },
  ]

  useEffect(() => {
    form.resetFields()
    if (dataEdit) {
      form.setFieldsValue({
        ...dataEdit,
        estado: dataEdit.estado ? 1 : 0,
        vendedores: dataEdit.vendedores.map(item => ({
          ...item,
          estado: item.estado ? 1 : 0,
          cumple: item.cumple ? dayjs(item.cumple) : undefined,
        })),
      })
    } else {
      form.setFieldsValue({
        estado: 1,
        ruc: textDefault,
      })
    }
  }, [form, dataEdit, open, textDefault])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {dataEdit ? 'Editar' : 'Crear'} Proveedor
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
        onFinish: crearProveedorForm,
      }}
    >
      <Tabs className='min-h-[315px]' items={items} />
    </ModalForm>
  )
}
