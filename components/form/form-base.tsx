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
  ...props
}: FormBaseProps<T>) {
  return (
    <Form<T> variant={variant} name={name} autoComplete={autoComplete} {...props}>
      {children}
    </Form>
  )
}
