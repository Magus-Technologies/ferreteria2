import SelectBase, { SelectBaseProps } from './select-base'
import { FaMoneyCheck } from 'react-icons/fa6'

interface SelectFormaDePagoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

// Formas de pago con códigos
const FORMAS_DE_PAGO = [
  { value: 'co', label: 'Contado' },
  { value: 'cr', label: 'Crédito' },
]

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
      options={FORMAS_DE_PAGO}
    />
  )
}
