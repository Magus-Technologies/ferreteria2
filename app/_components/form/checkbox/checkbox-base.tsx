'use client'

import { Checkbox, CheckboxProps, Form } from 'antd'
import { FormItemProps } from 'antd/lib'
import { useMemo } from 'react'

export interface CheckboxBaseProps extends CheckboxProps {
  formWithMessage?: boolean
  propsForm?: FormItemProps
}

function Base({ ...props }: CheckboxBaseProps) {
  return <Checkbox {...props} />
}

export default function CheckboxBase({
  formWithMessage = true,
  propsForm,
  ...props
}: CheckboxBaseProps) {
  const {
    hasFeedback = true,
    className = 'w-full',
    ...propsFormItem
  } = propsForm || {}

  const base = useMemo(() => <Base {...props} />, [props])

  return propsForm ? (
    <Form.Item
      hasFeedback={hasFeedback}
      {...propsFormItem}
      className={`${className} ${formWithMessage ? '' : '!mb-0'}`}
    >
      {base}
    </Form.Item>
  ) : (
    base
  )
}
