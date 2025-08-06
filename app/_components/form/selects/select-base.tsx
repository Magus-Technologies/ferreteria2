'use client'

import { Form, FormInstance, RefSelectProps, Select, SelectProps } from 'antd'
import { focusNext } from '../../../_utils/autofocus'
import { RefObject, useImperativeHandle, useState } from 'react'
import { FormItemProps } from 'antd/lib'

export interface RefSelectBaseProps extends RefSelectProps {
  changeValue: (value: unknown) => void
}

export interface SelectBaseProps extends SelectProps {
  nextInEnter?: boolean
  nextWithPrevent?: boolean
  formWithMessage?: boolean
  propsForm?: FormItemProps & {
    prefix_array_name?: (string | number)[]
  }
  ref?: RefObject<RefSelectBaseProps | null>
  form?: FormInstance
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
  onChange,
  form,
  optionFilterProp = 'label',
  ...props
}: SelectBaseProps) {
  const {
    hasFeedback = true,
    className = 'w-full',
    ...propsFormItem
  } = propsForm || {}

  const [value, setValue] = useState<unknown>()

  useImperativeHandle(props.ref, () => ({
    ...props.ref!.current!,
    changeValue: (value: unknown) => {
      if (form)
        form.setFieldValue(
          propsFormItem.name instanceof Array
            ? [
                ...(propsFormItem.prefix_array_name ?? []),
                ...propsFormItem.name,
              ]
            : propsFormItem.name,
          value
        )
      else setValue(value)
    },
  }))

  return propsForm ? (
    <Form.Item
      hasFeedback={hasFeedback}
      {...propsFormItem}
      className={`${className} ${formWithMessage ? '' : '!mb-0'}`}
    >
      <Base
        nextInEnter={nextInEnter}
        nextWithPrevent={nextWithPrevent}
        onKeyDown={onKeyDown}
        onOpenChange={onOpenChange}
        onChange={onChange}
        optionFilterProp={optionFilterProp}
        {...props}
      />
    </Form.Item>
  ) : (
    <Base
      nextInEnter={nextInEnter}
      nextWithPrevent={nextWithPrevent}
      onKeyDown={onKeyDown}
      onOpenChange={onOpenChange}
      onChange={value => {
        setValue(value)
        onChange?.(value)
      }}
      value={value}
      optionFilterProp={optionFilterProp}
      {...props}
    />
  )
}
