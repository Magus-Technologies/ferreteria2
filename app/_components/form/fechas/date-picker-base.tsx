'use client'

import { DatePicker, DatePickerProps, Form } from 'antd'
import { focusNext } from '../../../_utils/autofocus'
import { useMemo, useState } from 'react'
import { FormItemProps } from 'antd/lib'

export interface DatePickerBaseProps extends DatePickerProps {
  nextInEnter?: boolean
  nextWithPrevent?: boolean
  formWithMessage?: boolean
  propsForm?: FormItemProps
}

function Base({
  nextInEnter,
  nextWithPrevent,
  onKeyUp,
  onOpenChange,
  className = '!w-full',
  format = 'DD/MM/YYYY',
  ...props
}: DatePickerBaseProps) {
  const [open, setOpen] = useState(false)
  return (
    <DatePicker
      {...props}
      format={format}
      className={className}
      onOpenChange={open => {
        setOpen(open)
        onOpenChange?.(open)
      }}
      onKeyUp={e => {
        if (e.key === 'Enter' && nextInEnter) {
          if (!open) return
          if (nextWithPrevent) e.preventDefault()
          focusNext()
        }
        onKeyUp?.(e)
      }}
    />
  )
}

export default function DatePickerBase({
  nextInEnter = true,
  nextWithPrevent = true,
  onKeyUp,
  onOpenChange,
  formWithMessage = true,
  propsForm,
  className = '!w-full',
  ...props
}: DatePickerBaseProps) {
  const {
    hasFeedback = true,
    className: classNameFormItem = 'w-full',
    ...propsFormItem
  } = propsForm || {}

  const base = useMemo(
    () => (
      <Base
        nextInEnter={nextInEnter}
        nextWithPrevent={nextWithPrevent}
        onKeyUp={onKeyUp}
        className={className}
        onOpenChange={onOpenChange}
        {...props}
      />
    ),
    [nextInEnter, nextWithPrevent, onKeyUp, onOpenChange, className, props]
  )

  return propsForm ? (
    <Form.Item
      hasFeedback={hasFeedback}
      {...propsFormItem}
      className={`${classNameFormItem} ${formWithMessage ? '' : '!mb-0'}`}
    >
      {base}
    </Form.Item>
  ) : (
    base
  )
}
