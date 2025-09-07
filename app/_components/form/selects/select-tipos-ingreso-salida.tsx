'use client'

import { useServerQuery } from '~/hooks/use-server-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getTiposIngresoSalida } from '~/app/_actions/tipos-ingreso-salida'
import { FaCheckSquare } from 'react-icons/fa'

interface SelectTiposIngresoSalidaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  showButtonCreate?: boolean
}

export default function SelectTiposIngresoSalida({
  placeholder = 'Seleccionar Tipo',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectTiposIngresoSalidaProps) {
  const { response } = useServerQuery({
    action: getTiposIngresoSalida,
    propsQuery: {
      queryKey: [QueryKeys.TIPOS_INGRESO_SALIDA],
    },
    params: undefined,
  })

  return (
    <>
      <SelectBase
        showSearch
        prefix={<FaCheckSquare className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        options={response?.map(item => ({
          value: item.id,
          label: item.name,
        }))}
        {...props}
      />
    </>
  )
}
