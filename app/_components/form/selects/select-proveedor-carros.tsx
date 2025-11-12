'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { Carro } from '@prisma/client'
import { FaCar } from 'react-icons/fa6'
import { getProveedorResponseProps } from '~/app/_actions/proveedor'

interface SelectProveedorCarrosProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, carro?: Carro) => void
  proveedor: getProveedorResponseProps | undefined
}

export default function SelectProveedorCarros({
  placeholder = 'Buscar Carro de Proveedor',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  onChange,
  proveedor,
  ...props
}: SelectProveedorCarrosProps) {
  return (
    <SelectBase
      showSearch
      filterOption={false}
      prefix={<FaCar className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      onChange={value => {
        const carro = proveedor?.carros.find(carro => carro.id === value)
        onChange?.(value, carro)
      }}
      options={proveedor?.carros.map(carro => ({
        value: carro.id,
        label: carro.placa,
      }))}
      {...props}
    />
  )
}
