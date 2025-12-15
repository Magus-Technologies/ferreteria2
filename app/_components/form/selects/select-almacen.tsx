'use client'

import { PiWarehouseFill } from 'react-icons/pi'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useLazyServerQuery } from '~/hooks/use-lazy-server-query'
import { getAlmacenes } from '~/app/_actions/almacen'
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

  const { response, triggerFetch, isFetched } = useLazyServerQuery({
    action: getAlmacenes,
    propsQuery: {
      queryKey: [QueryKeys.ALMACENES],
    },
    params: undefined,
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
      options={response?.map(item => ({
        value: item.id,
        label: item.name,
      }))}
      onFocus={() => {
        if (!isFetched) {
          triggerFetch()
        }
      }}
      onOpenChange={(open) => {
        if (open && !isFetched) {
          triggerFetch()
        }
      }}
      onChange={value => {
        if (afecta_store) setAlmacenId(value)
        onChange?.(value)
      }}
    />
  )
}
