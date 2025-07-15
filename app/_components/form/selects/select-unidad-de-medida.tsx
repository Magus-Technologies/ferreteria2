import { FaWeightHanging } from 'react-icons/fa'
import SelectBase, { SelectBaseProps } from './select-base'

interface SelectUnidadDeMedidaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectUnidadDeMedida({
  placeholder = 'Seleccionar Unidad de Medida',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  ...props
}: SelectUnidadDeMedidaProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaWeightHanging className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 'unidad-de-medida-1', label: 'Unidad de Medida 1' },
        { value: 'unidad-de-medida-2', label: 'Unidad de Medida 2' },
      ]}
    />
  )
}
