'use client'

import { Form, FormProps } from 'antd'
import { v4 as uuid } from 'uuid'

export interface FormBaseProps<T> extends FormProps<T> {
  children: React.ReactNode
}

export default function FormBase<T>({
  children,
  variant = 'filled',
  name = uuid(),
  autoComplete = 'off',
  // Al fallar la validación, llevar la vista al primer campo con error.
  //
  // Sin esto, en formularios largos (crear guía, crear venta) apretar el botón
  // no producía NINGÚN efecto visible: el mensaje de error aparecía junto al
  // campo, muchas veces fuera de pantalla, y parecía que el sistema se había
  // colgado. El usuario solo se enteraba si scrolleaba por su cuenta.
  //
  // `block: 'center'` deja el campo a media pantalla, no pegado al borde, para
  // que se vea también la etiqueta y el mensaje.
  scrollToFirstError = { behavior: 'smooth', block: 'center' },
  ...props
}: FormBaseProps<T>) {
  return (
    <Form<T>
      variant={variant}
      name={name}
      autoComplete={autoComplete}
      scrollToFirstError={scrollToFirstError}
      {...props}
    >
      {children}
    </Form>
  )
}
