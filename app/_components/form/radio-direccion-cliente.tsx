import { Radio, Form, FormInstance } from 'antd'
import { TIPOS_DIRECCION_LIST, TipoDireccion } from '~/lib/api/cliente'

interface RadioDireccionClienteProps {
  form: FormInstance
}

/**
 * Mapeo de cada `TipoDireccion` al nombre del campo legacy del form que
 * guarda esa dirección. Antes este mapeo estaba duplicado como switch en
 * 4 ramas (`_cliente_direccion_1`..`_cliente_direccion_4`); ahora vive
 * en un solo objeto y el render itera con `TIPOS_DIRECCION_LIST`.
 */
const LEGACY_FIELD: Record<TipoDireccion, string> = {
  [TipoDireccion.D1]: '_cliente_direccion_1',
  [TipoDireccion.D2]: '_cliente_direccion_2',
  [TipoDireccion.D3]: '_cliente_direccion_3',
  [TipoDireccion.D4]: '_cliente_direccion_4',
}

export default function RadioDireccionCliente({ form }: RadioDireccionClienteProps) {
  const direccionSeleccionadaWatch = Form.useWatch('direccion_seleccionada', form)

  const cambiarDireccion = (opcion: TipoDireccion) => {
    // PRIMERO actualizar la selección
    form.setFieldValue('direccion_seleccionada', opcion)

    // LUEGO la dirección seleccionada — usa el mapeo común para evitar
    // 4 if/else.
    const direccionSeleccionada =
      form.getFieldValue(LEGACY_FIELD[opcion]) || ''

    form.setFieldValue('direccion', direccionSeleccionada)
    form.setFieldValue('direccion_entrega', direccionSeleccionada)
    form.setFieldValue('punto_llegada', direccionSeleccionada)
  }

  return (
    <Radio.Group
      value={direccionSeleccionadaWatch || TipoDireccion.D1}
      onChange={(e) => cambiarDireccion(e.target.value as TipoDireccion)}
      className='whitespace-nowrap flex items-center h-8'
    >
      {TIPOS_DIRECCION_LIST.map((tipo) => (
        <Radio key={tipo} value={tipo}>
          {tipo}
        </Radio>
      ))}
    </Radio.Group>
  )
}
