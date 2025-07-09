'use client'

import { Form, FormProps } from 'antd'
import { useEffect } from 'react'
import { v4 as uuid } from 'uuid'

interface FormBaseProps<T> extends FormProps<T> {
  children: React.ReactNode
  setSubmittable?: React.Dispatch<React.SetStateAction<boolean>>
  onChangeValues?: () => void
}

export default function FormBase<T>({
  children,
  variant = 'filled',
  form,
  name = uuid(),
  clearOnDestroy,
  setSubmittable,
  onChangeValues,
  ...props
}: FormBaseProps<T>) {
  const values = Form.useWatch([], form)

  useEffect(() => {
    if (onChangeValues) onChangeValues()
    form
      ?.validateFields({ validateOnly: true })
      .then(() => setSubmittable?.(true))
      .catch(() => {
        // console.log('🚀 ~ file: index.tsx:43 ~ e:', e)
        setSubmittable?.(false)
      })
  }, [form, onChangeValues, setSubmittable, values])

  return (
    <Form<T>
      variant={variant}
      form={form}
      name={name}
      clearOnDestroy={clearOnDestroy}
      {...props}
    >
      {children}
    </Form>
  )
}
