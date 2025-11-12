'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { Chofer } from '@prisma/client'
import { FaUser } from 'react-icons/fa6'
import { getProveedorResponseProps } from '~/app/_actions/proveedor'

interface SelectProveedorChoferesProps
  extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, chofer?: Chofer) => void
  proveedor: getProveedorResponseProps | undefined
}

export default function SelectProveedorChoferes({
  placeholder = 'Buscar Chofer de Proveedor',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  onChange,
  proveedor,
  ...props
}: SelectProveedorChoferesProps) {
  return (
    <SelectBase
      showSearch
      filterOption={false}
      prefix={<FaUser className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      onChange={value => {
        const chofer = proveedor?.choferes.find(chofer => chofer.id === value)
        onChange?.(value, chofer)
      }}
      options={proveedor?.choferes.map(chofer => ({
        value: chofer.id,
        label: chofer.name,
      }))}
      {...props}
    />
  )
}
