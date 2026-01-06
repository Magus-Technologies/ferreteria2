import { FormInstance } from 'antd'
import { Form, Spin } from 'antd'
import InputBase, { InputBaseProps } from './input-base'
import { ConsultaDni } from '~/app/_types/consulta-ruc'
import { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { consultaReniec } from '~/app/_actions/consulta-reniec'
import { useDebounce } from 'use-debounce'

interface InputConsultaDniProps extends Omit<InputBaseProps, 'form'> {
  form?: FormInstance
  nameWatch?: string | (string | number)[]
  onSuccess?: (data: ConsultaDni) => void
  automatico?: boolean
}

export default function InputConsultaDni({
  form,
  nameWatch,
  onSuccess,
  automatico = true,
  ...props
}: InputConsultaDniProps) {
  const { execute, loading } = useServerMutation({
    action: consultaReniec,
    onSuccess: res => {
      onSuccess?.(res.data as ConsultaDni)
    },
  })

  const [text, setText] = useState('')
  const [value] = useDebounce(text, 1000)

  const dni = Form.useWatch(nameWatch, form)
  
  useEffect(() => {
    if (dni) setText(dni)
  }, [dni])

  useEffect(() => {
    if (value && automatico && value.length === 8) {
      execute({ search: value })
    }
  }, [automatico, execute, value])

  return (
    <InputBase
      onChange={e => {
        if (!nameWatch) setText(e.target.value)
      }}
      placeholder='DNI'
      suffix={
        loading ? (
          <Spin size='small' />
        ) : (
          <FaSearch
            onClick={() => execute({ search: text })}
            className='text-cyan-600 cursor-pointer'
          />
        )
      }
      maxLength={8}
      {...props}
    />
  )
}
