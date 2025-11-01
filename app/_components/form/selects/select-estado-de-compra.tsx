import SelectBase, { SelectBaseProps } from './select-base'
import { EstadoDeCompra } from '@prisma/client'
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
          label: EstadoDeCompraSelect.Activos,
        },
        {
          value: EstadoDeCompra.EnEspera,
          label: EstadoDeCompra.EnEspera,
        },
        {
          value: EstadoDeCompra.Anulado,
          label: EstadoDeCompra.Anulado,
        },
      ]}
    />
  )
}
