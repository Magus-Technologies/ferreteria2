'use client'

import { Form, Input } from 'antd'
import { FormItemProps, InputProps } from 'antd/lib'
import { focusNext } from '../../../_utils/autofocus'
import { useMemo } from 'react'

export interface InputBaseProps extends InputProps {
  uppercase?: boolean
  nextInEnter?: boolean
  nextWithPrevent?: boolean
  formWithMessage?: boolean
  propsForm?: FormItemProps
}

function Base({
  uppercase = true,
  nextInEnter = true,
  nextWithPrevent = true,
  onInput,
  onKeyUp,
  autoComplete = 'off',
  variant = 'filled',
  ...props
}: InputBaseProps) {
  return (
    <Input
      {...props}
      variant={variant}
      onInput={e => {
        if (uppercase) {
          const el = e.currentTarget
          const start = el.selectionStart
          const end = el.selectionEnd
          const uppercased = el.value.toUpperCase()

          el.value = uppercased

          el.setSelectionRange(start, end)
        }
        onInput?.(e)
      }}
      autoComplete={autoComplete}
      onKeyUp={e => {
        if (e.key === 'Enter' && nextInEnter) {
          if (nextWithPrevent) e.preventDefault()
          focusNext()
        }
        onKeyUp?.(e)
      }}
    />
  )
}

export default function InputBase({
  uppercase = true,
  nextInEnter = true,
  nextWithPrevent = true,
  onInput,
  onKeyUp,
  autoComplete = 'off',
  variant = 'filled',
  formWithMessage = true,
  propsForm,
  ...props
}: InputBaseProps) {
  const {
    hasFeedback = true,
    className = 'w-full',
    ...propsFormItem
  } = propsForm || {}

  const base = useMemo(
    () => (
      <Base
        uppercase={uppercase}
        nextInEnter={nextInEnter}
        nextWithPrevent={nextWithPrevent}
        onInput={onInput}
        onKeyUp={onKeyUp}
        autoComplete={autoComplete}
        variant={variant}
        {...props}
      />
    ),
    [
      uppercase,
      nextInEnter,
      nextWithPrevent,
      onInput,
      onKeyUp,
      autoComplete,
      variant,
      props,
    ]
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
