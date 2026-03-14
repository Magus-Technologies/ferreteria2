'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { useState } from 'react'
import { FaUserTie } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { apiRequest } from '~/lib/api'

interface UsuarioOption {
  id: string
  name: string
  cargo: string | null
  email: string
}

interface SelectUsuariosDespachadoresProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: string, usuario?: UsuarioOption) => void
}

export default function SelectUsuariosDespachadores({
  placeholder = 'Buscar Usuario...',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  onChange,
  form,
  propsForm,
  ...props
}: SelectUsuariosDespachadoresProps) {
  const [text, setText] = useState('')
  const [value] = useDebounce(text, 500)

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: [QueryKeys.USUARIOS, 'despachadores', value],
    queryFn: async () => {
      const params = new URLSearchParams({ estado: '1' })
      if (value) params.append('search', value)
      const result = await apiRequest<{ data: UsuarioOption[] }>(`/usuarios?${params}`)
      return result.data?.data || []
    },
  })

  const options = usuarios.map((u) => ({
    value: u.id,
    label: `${u.name}${u.cargo ? ` — ${u.cargo}` : ''}`,
  }))

  return (
    <SelectBase
      form={form}
      propsForm={propsForm}
      showSearch
      filterOption={false}
      onSearch={setText}
      prefix={<FaUserTie className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      loading={isLoading}
      options={options}
      onChange={(val) => {
        const usuario = usuarios.find((u) => u.id === val)
        if (form && propsForm?.name) {
          form.setFieldValue(propsForm.name as string, val)
        }
        onChange?.(val, usuario)
      }}
      {...props}
    />
  )
}
