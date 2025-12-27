import { Radio, Form, FormInstance } from 'antd'

interface RadioDireccionClienteProps {
  form: FormInstance
}

export default function RadioDireccionCliente({ form }: RadioDireccionClienteProps) {
  const direccionSeleccionadaWatch = Form.useWatch('direccion_seleccionada', form)

  const cambiarDireccion = (opcion: 'D1' | 'D2' | 'D3') => {
    const direccion1 = form.getFieldValue('_cliente_direccion_1')
    const direccion2 = form.getFieldValue('_cliente_direccion_2')
    const direccion3 = form.getFieldValue('_cliente_direccion_3')

    // PRIMERO actualizar la selección
    form.setFieldValue('direccion_seleccionada', opcion)

    // LUEGO actualizar la dirección
    if (opcion === 'D1') {
      form.setFieldValue('direccion', direccion1 || '')
    } else if (opcion === 'D2') {
      form.setFieldValue('direccion', direccion2 || '')
    } else if (opcion === 'D3') {
      form.setFieldValue('direccion', direccion3 || '')
    }
  }

  return (
    <Radio.Group
      value={direccionSeleccionadaWatch || 'D1'}
      onChange={(e) => cambiarDireccion(e.target.value)}
      className='whitespace-nowrap flex items-center h-8'
    >
      <Radio value='D1'>D1</Radio>
      <Radio value='D2'>D2</Radio>
      <Radio value='D3'>D3</Radio>
    </Radio.Group>
  )
}
