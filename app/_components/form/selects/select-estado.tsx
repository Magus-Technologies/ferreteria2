import SelectBase, { SelectBaseProps } from './select-base'
import { FaBoltLightning } from 'react-icons/fa6'

interface SelectEstadoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectEstado({
  placeholder = 'Seleccionar Estado',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectEstadoProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaBoltLightning className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 1, label: 'Activo' },
        { value: 0, label: 'Inactivo' },
      ]}
    />
  )
}
