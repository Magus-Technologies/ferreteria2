'use client'

import { Checkbox, CheckboxProps, Form } from 'antd'
import { focusNext } from '../../../_utils/autofocus'
import { FormItemProps } from 'antd/lib'
import { useMemo } from 'react'

export interface CheckboxBaseProps extends CheckboxProps {
  nextInEnter?: boolean
  nextWithPrevent?: boolean
  formWithMessage?: boolean
  propsForm?: FormItemProps
}

function Base({
  nextInEnter,
  nextWithPrevent,
  onKeyDown,
  ...props
}: CheckboxBaseProps) {
  return (
    <Checkbox
      {...props}
      onKeyDown={e => {
        if (e.key === 'Enter' && nextInEnter) {
          if (!open) return
          if (nextWithPrevent) e.preventDefault()
          focusNext()
        }
        onKeyDown?.(e)
      }}
    />
  )
}

export default function CheckboxBase({
  nextInEnter = true,
  nextWithPrevent = true,
  onKeyDown,
  formWithMessage = true,
  propsForm,
  ...props
}: CheckboxBaseProps) {
  const {
    hasFeedback = true,
    className = 'w-full',
    ...propsFormItem
  } = propsForm || {}

  const base = useMemo(
    () => (
      <Base
        nextInEnter={nextInEnter}
        nextWithPrevent={nextWithPrevent}
        onKeyDown={onKeyDown}
        {...props}
      />
    ),
    [nextInEnter, nextWithPrevent, onKeyDown, props]
  )

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
