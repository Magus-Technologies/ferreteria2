'use client'

import { Form, InputNumber } from 'antd'
import { FormItemProps, InputNumberProps } from 'antd/lib'
import { focusNext } from '../../../_utils/autofocus'
import { useMemo, useState } from 'react'

interface InputNumberBaseProps extends InputNumberProps {
  nextInEnter?: boolean
  nextWithPrevent?: boolean
  formWithMessage?: boolean
  propsForm?: FormItemProps
  ref?: React.RefObject<HTMLInputElement | null>
}

function Base({
  nextInEnter = true,
  nextWithPrevent = true,
  controls = false,
  onKeyUp,
  onFocus,
  readOnly,
  className = '!w-full',
  // "one-time-code": Chrome ignora "off" para autofill de tarjetas (Google Pay)
  // y los campos numericos (precio/cantidad/numero) son los mas propensos a
  // clasificarse como cc-number. Un proposito explicito anula la heuristica.
  autoComplete = 'one-time-code',
  variant = 'filled',
  type = 'number',
  ref,
  ...props
}: InputNumberBaseProps) {
  // Anti-autofill de Chrome: arranca readOnly (Chrome no autocompleta campos
  // readOnly) y se vuelve editable al enfocar. Solo si no se controla readOnly.
  const autoBlock = readOnly === undefined
  const [blocked, setBlocked] = useState(autoBlock)
  const effectiveReadOnly = autoBlock ? blocked : readOnly

  return (
    <InputNumber
      ref={ref}
      type={type}
      controls={controls}
      variant={variant}
      className={className}
      autoComplete={autoComplete}
      onKeyUp={e => {
        if (e.key === 'Enter' && nextInEnter) {
          if (nextWithPrevent) e.preventDefault()
          focusNext()
        }
        onKeyUp?.(e)
      }}
      {...props}
      readOnly={effectiveReadOnly}
      onFocus={e => {
        if (autoBlock) setBlocked(false)
        onFocus?.(e)
      }}
    />
  )
}

export default function InputNumberBase({
  nextInEnter = true,
  nextWithPrevent = true,
  controls = false,
  onKeyUp,
  // "one-time-code": Chrome ignora "off" para autofill de tarjetas (Google Pay)
  // y los campos numericos son los mas propensos a clasificarse como cc-number.
  // Un proposito explicito anula la heuristica del navegador.
  autoComplete = 'one-time-code',
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
        onKeyUp={onKeyUp}
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
      onKeyUp,
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
