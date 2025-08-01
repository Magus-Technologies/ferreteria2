'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { FaLocationCrosshairs } from 'react-icons/fa6'
import { getUbicaciones } from '~/app/_actions/ubicacion'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEffect, useRef } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import ButtonCreateUbicacion from '../buttons/button-create-ubicacion'

interface SelectUbicacionesProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectUbicaciones({
  placeholder = 'Seleccionar Ubicación',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  showButtonCreate = false,
  ...props
}: SelectUbicacionesProps) {
  const selectUbicacionesRef = useRef<RefSelectBaseProps>(null)

  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const { response, refetch } = useServerQuery({
    action: getUbicaciones,
    propsQuery: {
      queryKey: [QueryKeys.UBICACIONES],
    },
    params: { almacen_id: almacen_id || 0 },
  })

  useEffect(() => {
    refetch()
    selectUbicacionesRef.current?.changeValue(undefined)
  }, [almacen_id, refetch])

  return (
    <>
      <SelectBase
        ref={selectUbicacionesRef}
        prefix={
          <FaLocationCrosshairs className={classNameIcon} size={sizeIcon} />
        }
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
        {...props}
      />
      {showButtonCreate && <ButtonCreateUbicacion />}
    </>
  )
}
