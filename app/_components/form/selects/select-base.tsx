'use client'

import { Form, Select, SelectProps } from 'antd'
import { focusNext } from '../../../_utils/autofocus'
import { useMemo, useState } from 'react'
import { FormItemProps } from 'antd/lib'

export interface SelectBaseProps extends SelectProps {
  nextInEnter?: boolean
  nextWithPrevent?: boolean
  formWithMessage?: boolean
  propsForm?: FormItemProps
}

function Base({
  nextInEnter,
  nextWithPrevent,
  onKeyDown,
  onOpenChange,
  ...props
}: SelectBaseProps) {
  const [open, setOpen] = useState(false)
  return (
    <Select
      {...props}
      onOpenChange={open => {
        setOpen(open)
        onOpenChange?.(open)
      }}
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

export default function SelectBase({
  nextInEnter = true,
  nextWithPrevent = true,
  onKeyDown,
  onOpenChange,
  formWithMessage = true,
  propsForm,
  ...props
}: SelectBaseProps) {
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
        onOpenChange={onOpenChange}
        {...props}
      />
    ),
    [nextInEnter, nextWithPrevent, onKeyDown, onOpenChange, props]
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
