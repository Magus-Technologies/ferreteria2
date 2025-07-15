import SelectBase, { SelectBaseProps } from './select-base'
import { TbBrand4Chan } from 'react-icons/tb'

interface SelectMarcasProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectMarcas({
  placeholder = 'Seleccionar Marca',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectMarcasProps) {
  return (
    <SelectBase
      {...props}
      prefix={<TbBrand4Chan className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 'marca-1', label: 'Marca 1' },
        { value: 'marca-2', label: 'Marca 2' },
      ]}
    />
  )
}
