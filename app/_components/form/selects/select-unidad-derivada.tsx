import { FaWeightHanging } from 'react-icons/fa'
import SelectBase, { SelectBaseProps } from './select-base'

interface SelectUnidadDerivadaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectUnidadDerivada({
  placeholder = 'Unidad Derivada',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  ...props
}: SelectUnidadDerivadaProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaWeightHanging className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 1, label: 'UNIDAD' },
        { value: 2, label: 'DOCENA' },
      ]}
    />
  )
}
