'use client'

import { PiWarehouseFill } from 'react-icons/pi'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useQuery } from '@tanstack/react-query'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useEffect, useRef } from 'react'

interface SelectAlmacenProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  afecta_store?: boolean
}

export default function SelectAlmacen({
  placeholder = 'Seleccionar Almacén',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-2',
  sizeIcon = 20,
  className = 'min-w-[300px]',
  size = 'large',
  afecta_store = true,
  onChange,
  ...props
}: SelectAlmacenProps) {
  const selectAlmacenRef = useRef<RefSelectBaseProps>(null)
  const setAlmacenId = useStoreAlmacen(store => store.setAlmacenId)
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const { data } = useQuery({
    queryKey: [QueryKeys.ALMACENES],
    queryFn: async () => {
      const response = await almacenesApi.getAll()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  useEffect(() => {
    if (afecta_store) selectAlmacenRef.current?.changeValue(almacen_id)
  }, [afecta_store, almacen_id])

  return (
    <SelectBase
      ref={selectAlmacenRef}
      {...props}
      prefix={<PiWarehouseFill className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      className={className}
      size={size}
      options={data?.map(item => ({
        value: item.id,
        label: item.name,
      }))}
      onChange={value => {
        if (afecta_store) setAlmacenId(value)
        onChange?.(value)
      }}
    />
  )
}
