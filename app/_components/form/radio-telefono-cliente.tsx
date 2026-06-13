import { Radio, Form, FormInstance } from 'antd'
import {
  TIPOS_TELEFONO_LIST,
  TipoTelefono,
  TELEFONO_LABEL,
  TELEFONO_FORM_HIDDEN,
} from '~/lib/utils/cliente-telefonos-form'

interface RadioTelefonoClienteProps {
  form: FormInstance
}

/**
 * Selector de teléfono del cliente (Cel 1 / Cel 2), análogo a
 * `RadioDireccionCliente`. Al cambiar de slot:
 *   1. Guarda el valor visible actual en el slot que estaba activo
 *      (preserva las ediciones inline que el usuario haya hecho).
 *   2. Carga el valor del nuevo slot en el campo visible `telefono`.
 *
 * El valor final de ambos teléfonos se reconstruye con
 * `resolverTelefonosCliente` al guardar (ver use-create-venta / cotización).
 */
export default function RadioTelefonoCliente({ form }: RadioTelefonoClienteProps) {
  const seleccionadoWatch = Form.useWatch('telefono_seleccionado', form)
  const activo = (seleccionadoWatch as TipoTelefono) || TipoTelefono.C1

  const cambiar = (nuevo: TipoTelefono) => {
    if (nuevo === activo) return
    // 1. Persistir lo escrito en el slot que estaba activo.
    const visibleActual = form.getFieldValue('telefono') ?? ''
    form.setFieldValue(TELEFONO_FORM_HIDDEN[activo], visibleActual)

    // 2. Cargar el valor del nuevo slot al campo visible.
    form.setFieldValue('telefono_seleccionado', nuevo)
    form.setFieldValue('telefono', form.getFieldValue(TELEFONO_FORM_HIDDEN[nuevo]) ?? '')
  }

  return (
    <Radio.Group
      value={activo}
      onChange={(e) => cambiar(e.target.value as TipoTelefono)}
      className="whitespace-nowrap flex items-center h-8"
    >
      {TIPOS_TELEFONO_LIST.map((tipo) => (
        <Radio key={tipo} value={tipo}>
          {TELEFONO_LABEL[tipo]}
        </Radio>
      ))}
    </Radio.Group>
  )
}
