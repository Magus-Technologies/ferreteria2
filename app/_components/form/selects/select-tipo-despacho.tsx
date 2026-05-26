import SelectBase, { SelectBaseProps } from './select-base'
import { FaTruck } from 'react-icons/fa'

interface SelectTipoDespachoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

// Tipos de despacho
const TIPOS_DESPACHO = [
  { value: 'EnTienda', label: '🏪 Despacho en Tienda' },
  { value: 'Domicilio', label: '🚚 Despacho a Domicilio' },
  { value: 'Parcial', label: '📦 Despacho Parcial' },
  { value: 'Omitir', label: '⏭ Omitir Entrega' },
]

export default function SelectTipoDespacho({
  placeholder = 'Seleccionar Tipo de Despacho',
  variant = 'filled',
  classNameIcon = 'text-purple-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectTipoDespachoProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={TIPOS_DESPACHO}
    />
  )
}
