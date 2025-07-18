'use client'

import { DatePicker, Form } from 'antd'
import { focusNext } from '../../../_utils/autofocus'
import { useState } from 'react'
import { FormItemProps } from 'antd/lib'
import { RangePickerProps } from 'antd/es/date-picker'
const { RangePicker } = DatePicker

export interface RangePickerBaseProps extends RangePickerProps {
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
}: RangePickerBaseProps) {
  const [open, setOpen] = useState(false)
  return (
    <RangePicker
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
        onKeyDown?.(e, () => {})
      }}
    />
  )
}

export default function RangePickerBase({
  nextInEnter = true,
  nextWithPrevent = true,
  onKeyDown,
  onOpenChange,
  formWithMessage = true,
  propsForm,
  ...props
}: RangePickerBaseProps) {
  const {
    hasFeedback = true,
    className = 'w-full',
    ...propsFormItem
  } = propsForm || {}

  const base = (
    <Base
      nextInEnter={nextInEnter}
      nextWithPrevent={nextWithPrevent}
      onKeyDown={onKeyDown}
      onOpenChange={onOpenChange}
      {...props}
    />
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
