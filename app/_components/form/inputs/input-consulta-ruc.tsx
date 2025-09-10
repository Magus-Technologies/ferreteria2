import { ConsultaDni, ConsultaRuc } from '~/app/_types/consulta-ruc'
import InputBase, { InputBaseProps } from './input-base'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { consultaReniec } from '~/app/_actions/consulta-reniec'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Spin } from 'antd'
import { FaSearch } from 'react-icons/fa'

interface InputConsultaRucProps extends InputBaseProps {
  onSuccess?: (data: ConsultaDni | ConsultaRuc) => void
}

export default function InputConsultaRuc({
  onSuccess,
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

  useEffect(() => {
    if (value) execute({ search: value })
  }, [execute, value])

  return (
    <InputBase
      onChange={e => setText(e.target.value)}
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
