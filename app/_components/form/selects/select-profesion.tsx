'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import SelectBase, { type SelectBaseProps } from './select-base'
import { profesionesApi } from '~/lib/api/profesion'

export default function SelectProfesion(props: SelectBaseProps) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.PROFESIONES],
    queryFn: async () => {
      const res = await profesionesApi.getAll()
      if (res.error) throw new Error(res.error.message)
      return res.data?.data || []
    },
  })

  return (
    <SelectBase
      {...props}
      loading={isLoading}
      placeholder={props.placeholder || 'Seleccionar profesión'}
      options={(data || []).map((profesion) => ({
        value: profesion.id,
        label: profesion.nombre,
      }))}
      allowClear={props.allowClear ?? true}
      showSearch={props.showSearch ?? true}
      filterOption={(input, option) =>
        String(option?.label || '').toLowerCase().includes(input.toLowerCase())
      }
    />
  )
}
