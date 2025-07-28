import SelectBase, { SelectBaseProps } from './select-base'
import { FaBoltLightning } from 'react-icons/fa6'

interface SelectCSComisionProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectCSComision({
  placeholder = 'C/S Comisión',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectCSComisionProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaBoltLightning className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 'all', label: 'Todos' },
        { value: 'con_comision', label: 'Con Comisión' },
        { value: 'sin_comision', label: 'Sin Comisión' },
      ]}
    />
  )
}
