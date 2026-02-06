'use client'

import { Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { usuariosApi } from '~/lib/api/usuarios'
import { useState } from 'react'

interface SelectSupervisorProps {
  value?: string
  onChange?: (value: string | undefined, option?: any) => void
  size?: 'small' | 'middle' | 'large'
  placeholder?: string
  allowClear?: boolean
}

export default function SelectSupervisor({
  value,
  onChange,
  size = 'middle',
  placeholder = 'Seleccione supervisor',
  allowClear = true,
}: SelectSupervisorProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['supervisores'],
    queryFn: async () => {
      const response = await usuariosApi.getSupervisores()
      
      // Si hay error, lanzarlo para que React Query lo maneje
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // El backend devuelve { data: [...] }
      return response.data?.data || []
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  return (
    <Select
      value={value}
      onChange={onChange}
      size={size}
      placeholder={placeholder}
      allowClear={allowClear}
      loading={isLoading}
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={data?.map((supervisor: any) => ({
        value: supervisor.id,
        label: supervisor.name,
      }))}
      className='w-full'
      onFocus={() => {
        if (!shouldFetch) {
          setShouldFetch(true)
        }
      }}
      onDropdownVisibleChange={(open) => {
        if (open && !shouldFetch) {
          setShouldFetch(true)
        }
      }}
    />
  )
}
