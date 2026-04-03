import SelectBase, { SelectBaseProps } from './select-base'
import { EstadoDeCompra } from '~/types'
import { FaInfoCircle } from 'react-icons/fa'

interface SelectEstadoDeCompraProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export const EstadoDeCompraSelect = {
  Activos: 'Activos',
}

export default function SelectEstadoDeCompra({
  placeholder = 'Seleccionar Estado de Compra',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectEstadoDeCompraProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaInfoCircle className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        {
          value: EstadoDeCompraSelect.Activos,
          label: 'Activos',
        },
        {
          value: EstadoDeCompra.EnEspera,
          label: 'En Espera',
        },
        {
          value: EstadoDeCompra.Anulado,
          label: 'Anulado',
        },
      ]}
    />
  )
}
