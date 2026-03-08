import { FaTruckLoading } from 'react-icons/fa'
import SelectBase, { SelectBaseProps } from './select-base'
import { EstadoDeCompra } from '~/types'

interface SelectPendienteDeRecepcionAlmacenProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectPendienteDeRecepcionAlmacen({
  placeholder = 'Pendiente de Recepción',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectPendienteDeRecepcionAlmacenProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaTruckLoading className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: EstadoDeCompra.Creado, label: 'Pendiente' },
        { value: EstadoDeCompra.Procesado, label: 'Procesado' },
      ]}
    />
  )
}
