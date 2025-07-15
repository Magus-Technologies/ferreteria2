import SelectBase, { SelectBaseProps } from './select-base'
import { FaLocationCrosshairs } from 'react-icons/fa6'

interface SelectUbicacionesProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectUbicaciones({
  placeholder = 'Seleccionar Ubicación',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectUbicacionesProps) {
  return (
    <SelectBase
      {...props}
      prefix={
        <FaLocationCrosshairs className={classNameIcon} size={sizeIcon} />
      }
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 'ubicacion-1', label: 'Ubicación 1' },
        { value: 'ubicacion-2', label: 'Ubicación 2' },
      ]}
    />
  )
}
