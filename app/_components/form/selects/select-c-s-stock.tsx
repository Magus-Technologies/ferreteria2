import SelectBase, { SelectBaseProps } from './select-base'
import { FaBoltLightning } from 'react-icons/fa6'

interface SelectCSStockProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export enum CSStock {
  ALL = 'all',
  CON_STOCK = 'con_stock',
  SIN_STOCK = 'sin_stock',
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
        { value: CSStock.ALL, label: 'Todos' },
        { value: CSStock.CON_STOCK, label: 'Con Stock' },
        { value: CSStock.SIN_STOCK, label: 'Sin Stock' },
      ]}
    />
  )
}
