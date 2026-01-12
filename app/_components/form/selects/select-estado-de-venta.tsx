import SelectBase, { SelectBaseProps } from './select-base'
import { FaCircleCheck } from 'react-icons/fa6'

interface SelectEstadoDeVentaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

// Estados de venta con códigos
const ESTADOS_DE_VENTA = [
  { value: 'cr', label: 'Creado' },
  { value: 'ee', label: 'En Espera' },
  { value: 'pr', label: 'Procesado' },
  { value: 'an', label: 'Anulado' },
]

export default function SelectEstadoDeVenta({
  placeholder = 'Seleccionar Estado',
  variant = 'filled',
  classNameIcon = 'text-green-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectEstadoDeVentaProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaCircleCheck className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={ESTADOS_DE_VENTA}
    />
  )
}
