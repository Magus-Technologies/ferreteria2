'use client'

import { Select, SelectProps } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { subCajaApi } from '~/lib/api/sub-caja'
import { FormItemProps } from 'antd/lib'
import { Form } from 'antd'

interface SelectSubCajaProps extends SelectProps {
  cajaPrincipalId?: number
  propsForm?: FormItemProps
}

export default function SelectSubCaja({
  cajaPrincipalId,
  propsForm,
  ...rest
}: SelectSubCajaProps) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, cajaPrincipalId],
    queryFn: async () => {
      if (!cajaPrincipalId) return []
      const response = await subCajaApi.getByCajaPrincipal(cajaPrincipalId)
      return response.data?.data || []
    },
    enabled: !!cajaPrincipalId,
  })

  const selectComponent = (
    <Select
      {...rest}
      loading={isLoading}
      disabled={!cajaPrincipalId || isLoading}
      placeholder={cajaPrincipalId ? 'Selecciona una sub-caja' : 'Primero selecciona una caja principal'}
      options={data?.map((subCaja) => ({
        label: `${subCaja.codigo} - ${subCaja.nombre}`,
        value: subCaja.id,
      }))}
    />
  )

  if (propsForm) {
    return <Form.Item {...propsForm}>{selectComponent}</Form.Item>
  }

  return selectComponent
}
