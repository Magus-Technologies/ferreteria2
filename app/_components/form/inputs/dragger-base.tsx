'use client'

import { DraggerProps, Form, Upload } from 'antd'
import { FormItemProps } from 'antd/lib'
import { useMemo } from 'react'
import { normFile } from '~/utils/upload'

interface DraggerBaseProps extends DraggerProps {
  formWithMessage?: boolean
  propsForm?: FormItemProps
  title: React.ReactNode
  description: React.ReactNode
  icon?: React.ReactNode
}

function Base({ title, description, icon, ...props }: DraggerBaseProps) {
  return (
    <Upload.Dragger {...props}>
      <div className='flex flex-col gap-2 justify-center items-center'>
        {icon}
        <div className='flex flex-col text-slate-400 font-semibold text-lg'>
          {title}
        </div>
      </div>
      <div className='text-gray-400'>{description}</div>
    </Upload.Dragger>
  )
}

export default function DraggerBase({
  formWithMessage = true,
  propsForm,
  ...props
}: DraggerBaseProps) {
  const {
    hasFeedback = true,
    className = 'w-full',
    ...propsFormItem
  } = propsForm || {}

  const base = useMemo(() => <Base {...props} />, [props])

  return propsForm ? (
    <Form.Item
      getValueFromEvent={normFile}
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
