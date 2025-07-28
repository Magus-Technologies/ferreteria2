'use client'

import { Form, InputNumber } from 'antd'
import { FormItemProps, InputNumberProps } from 'antd/lib'
import { focusNext } from '../../../_utils/autofocus'
import { useMemo } from 'react'

interface InputNumberBaseProps extends InputNumberProps {
  nextInEnter?: boolean
  nextWithPrevent?: boolean
  formWithMessage?: boolean
  propsForm?: FormItemProps
}

function Base({
  nextInEnter = true,
  nextWithPrevent = true,
  controls = false,
  onKeyDown,
  className = '!w-full',
  autoComplete = 'off',
  variant = 'filled',
  type = 'number',
  ...props
}: InputNumberBaseProps) {
  return (
    <InputNumber
      {...props}
      type={type}
      controls={controls}
      variant={variant}
      className={className}
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

export default function InputNumberBase({
  nextInEnter = true,
  nextWithPrevent = true,
  controls = false,
  onKeyDown,
  autoComplete = 'off',
  variant = 'filled',
  formWithMessage = true,
  className = '!w-full',
  type = 'number',
  propsForm,
  ...props
}: InputNumberBaseProps) {
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
        controls={controls}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        variant={variant}
        className={className}
        type={type}
        {...props}
      />
    ),
    [
      nextInEnter,
      nextWithPrevent,
      controls,
      onKeyDown,
      autoComplete,
      variant,
      className,
      type,
      props,
    ]
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
