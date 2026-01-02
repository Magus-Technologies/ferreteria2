import { Radio, Form, FormInstance } from 'antd'

interface RadioDireccionClienteProps {
  form: FormInstance
}

export default function RadioDireccionCliente({ form }: RadioDireccionClienteProps) {
  const direccionSeleccionadaWatch = Form.useWatch('direccion_seleccionada', form)

  const cambiarDireccion = (opcion: 'D1' | 'D2' | 'D3' | 'D4') => {
    const direccion1 = form.getFieldValue('_cliente_direccion_1')
    const direccion2 = form.getFieldValue('_cliente_direccion_2')
    const direccion3 = form.getFieldValue('_cliente_direccion_3')
    const direccion4 = form.getFieldValue('_cliente_direccion_4')

    // PRIMERO actualizar la selección
    form.setFieldValue('direccion_seleccionada', opcion)

    // LUEGO actualizar la dirección
    if (opcion === 'D1') {
      form.setFieldValue('direccion', direccion1 || '')
    } else if (opcion === 'D2') {
      form.setFieldValue('direccion', direccion2 || '')
    } else if (opcion === 'D3') {
      form.setFieldValue('direccion', direccion3 || '')
    } else if (opcion === 'D4') {
      form.setFieldValue('direccion', direccion4 || '')
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
      <Radio value='D4'>D4</Radio>
    </Radio.Group>
  )
}
