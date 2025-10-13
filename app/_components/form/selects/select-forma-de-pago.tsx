import SelectBase, { SelectBaseProps } from './select-base'
import { FaMoneyCheck } from 'react-icons/fa6'
import { FormaDePago } from '@prisma/client'

interface SelectFormaDePagoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectFormaDePago({
  placeholder = 'Seleccionar Forma de Pago',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectFormaDePagoProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaMoneyCheck className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={Object.values(FormaDePago).map(value => ({
        value,
        label: value,
      }))}
    />
  )
}
