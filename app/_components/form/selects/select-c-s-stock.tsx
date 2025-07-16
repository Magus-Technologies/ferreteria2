import SelectBase, { SelectBaseProps } from './select-base'
import { FaBoltLightning } from 'react-icons/fa6'

interface SelectCSStockProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectCSStock({
  placeholder = 'C/S Stock',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectCSStockProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaBoltLightning className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 'all', label: 'Todos' },
        { value: 'con_stock', label: 'Con Stock' },
        { value: 'sin_stock', label: 'Sin Stock' },
      ]}
    />
  )
}
