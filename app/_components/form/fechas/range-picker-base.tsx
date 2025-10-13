'use client'

import { DatePicker, Form } from 'antd'
import { focusNext } from '../../../_utils/autofocus'
import { useMemo, useState } from 'react'
import { FormItemProps } from 'antd/lib'
import { RangePickerProps } from 'antd/es/date-picker'
import { presetsRangePicker } from '~/lib/presets-range-picker'
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
  onKeyUp,
  onOpenChange,
  format = 'DD/MM/YYYY',
  presets = presetsRangePicker,
  ...props
}: RangePickerBaseProps) {
  const [open, setOpen] = useState(false)
  return (
    <RangePicker
      {...props}
      format={format}
      presets={presets}
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

export default function RangePickerBase({
  nextInEnter = true,
  nextWithPrevent = true,
  onKeyUp,
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

  const base = useMemo(
    () => (
      <Base
        nextInEnter={nextInEnter}
        nextWithPrevent={nextWithPrevent}
        onKeyUp={onKeyUp}
        onOpenChange={onOpenChange}
        {...props}
      />
    ),
    [nextInEnter, nextWithPrevent, onKeyUp, onOpenChange, props]
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
