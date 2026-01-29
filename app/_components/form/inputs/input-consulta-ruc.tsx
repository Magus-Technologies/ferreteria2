import { ConsultaDni, ConsultaRuc } from '~/app/_types/consulta-ruc'
import InputBase, { InputBaseProps } from './input-base'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { consultaReniec } from '~/app/_actions/consulta-reniec'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Form, Spin } from 'antd'
import { FaSearch } from 'react-icons/fa'
import { FormInstance } from 'antd/lib'

interface InputConsultaRucProps extends Omit<InputBaseProps, 'form'> {
  onSuccess?: (data: ConsultaDni | ConsultaRuc) => void
  form?: FormInstance
  nameWatch?: string | (string | number)[]
  automatico?: boolean
}

export default function InputConsultaRuc({
  onSuccess,
  form,
  nameWatch,
  automatico = true,
  ...props
}: InputConsultaRucProps) {
  const { execute, loading } = useServerMutation({
    action: consultaReniec,
    onSuccess: res => {
      onSuccess?.(res.data!)
    },
  })

  const [text, setText] = useState('')

  const [value] = useDebounce(text, 1000)

  const ruc = Form.useWatch(nameWatch, form)
  useEffect(() => {
    if (ruc) setText(ruc)
  }, [ruc])

  useEffect(() => {
    if (value && automatico && (value.length === 8 || value.length === 11)) {
      execute({ search: value })
    } 
  }, [automatico, execute, value])

  return (
    <InputBase
      onChange={e => {
        if (!nameWatch) setText(e.target.value)
      }}
      placeholder='Buscar RUC / DNI'
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
      {...props}
    />
  )
}
