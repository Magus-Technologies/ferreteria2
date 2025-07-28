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
  clearOnDestroy = true,
  ...props
}: FormBaseProps<T>) {
  return (
    <Form<T>
      variant={variant}
      name={name}
      clearOnDestroy={clearOnDestroy}
      {...props}
    >
      {children}
    </Form>
  )
}
