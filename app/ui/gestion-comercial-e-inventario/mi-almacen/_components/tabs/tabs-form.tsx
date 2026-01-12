import { Tabs } from 'antd'
import { TabsProps } from 'antd/lib'
import FormCreateProducto from '../form/form-create-producto'
import { FormInstance } from 'antd'
import FormInformacionAdicional from '../form/form-informacion-adicional'

interface TabsFormProps {
  form: FormInstance
}

export default function TabsForm({ form }: TabsFormProps) {
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Datos Iniciales',
      children: <FormCreateProducto form={form} />,
    },
    {
      key: '2',
      label: 'Información adicional',
      children: <FormInformacionAdicional />,
    },
  ]

  return <Tabs items={items} />
}
