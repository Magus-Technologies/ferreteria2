import { PiWarehouseFill } from 'react-icons/pi'
import SelectBase, { SelectBaseProps } from './select-base'

interface SelectAlmacenProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectAlmacen({
  placeholder = 'Seleccionar Almacén',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-2',
  sizeIcon = 20,
  className = 'min-w-[300px]',
  size = 'large',
  ...props
}: SelectAlmacenProps) {
  return (
    <SelectBase
      {...props}
      prefix={<PiWarehouseFill className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      className={className}
      size={size}
      options={[
        { value: 'almacen-1', label: 'Almacén 1' },
        { value: 'almacen-2', label: 'Almacén 2' },
      ]}
    />
  )
}
