import SelectBase, { SelectBaseProps } from './select-base'
import { FaBoltLightning } from 'react-icons/fa6'

interface SelectCSComisionProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export enum CSComision {
  ALL = 'all',
  CON_COMISION = 'con_comision',
  SIN_COMISION = 'sin_comision',
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
        { value: CSComision.ALL, label: 'Todos' },
        { value: CSComision.CON_COMISION, label: 'Con Comisión' },
        { value: CSComision.SIN_COMISION, label: 'Sin Comisión' },
      ]}
    />
  )
}
