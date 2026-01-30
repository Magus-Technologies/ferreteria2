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

    // LUEGO actualizar la dirección (tanto 'direccion' como 'direccion_entrega' y 'punto_llegada')
    let direccionSeleccionada = ''
    if (opcion === 'D1') {
      direccionSeleccionada = direccion1 || ''
    } else if (opcion === 'D2') {
      direccionSeleccionada = direccion2 || ''
    } else if (opcion === 'D3') {
      direccionSeleccionada = direccion3 || ''
    } else if (opcion === 'D4') {
      direccionSeleccionada = direccion4 || ''
    }

    form.setFieldValue('direccion', direccionSeleccionada)
    form.setFieldValue('direccion_entrega', direccionSeleccionada)
    form.setFieldValue('punto_llegada', direccionSeleccionada) // Agregado para guías
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
