'use client'

import { Form, Input } from 'antd'
import { FormItemProps } from 'antd/lib'
import { focusNext } from '../../../_utils/autofocus'
import { useMemo } from 'react'
import { TextAreaProps } from 'antd/es/input'

interface TextareaBaseProps extends TextAreaProps {
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
  onKeyDown,
  autoComplete = 'off',
  variant = 'filled',
  ...props
}: TextareaBaseProps) {
  return (
    <Input.TextArea
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
      onKeyDown={e => {
        if (e.key === 'Enter' && nextInEnter) {
          if (nextWithPrevent) e.preventDefault()
          focusNext()
        }
        onKeyDown?.(e)
      }}
    />
  )
}

export default function TextareaBase({
  uppercase = true,
  nextInEnter = true,
  nextWithPrevent = true,
  onInput,
  onKeyDown,
  autoComplete = 'off',
  variant = 'filled',
  formWithMessage = true,
  propsForm,
  ...props
}: TextareaBaseProps) {
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
        onKeyDown={onKeyDown}
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
      onKeyDown,
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
