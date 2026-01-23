'use client'

import { useQuery } from '@tanstack/react-query'
import { Form, Select } from 'antd'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { metodoDePagoApi } from '~/lib/api/metodo-de-pago'

interface SelectMetodoDePagoProps {
  propsForm?: any
  disabled?: boolean
  placeholder?: string
}

export default function SelectMetodoDePago({
  propsForm,
  disabled = false,
  placeholder = 'Selecciona un banco',
}: SelectMetodoDePagoProps) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.METODO_DE_PAGO],
    queryFn: async () => {
      const response = await metodoDePagoApi.getAll()
      return response.data?.data || []
    },
  })

  return (
    <Form.Item {...propsForm}>
      <Select
        placeholder={placeholder}
        loading={isLoading}
        disabled={disabled}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={data?.map((banco) => ({
          value: banco.id,
          label: banco.name,
        }))}
      />
    </Form.Item>
  )
}
