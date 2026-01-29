import SelectBase, { SelectBaseProps } from './select-base'
import { FaMoneyCheck } from 'react-icons/fa6'

export enum EstadoDeCuenta {
  Pagado = 'Pagado',
  Deuda = 'Deuda',
}

interface SelectEstadoDeCuentaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectEstadoDeCuenta({
  placeholder = 'Seleccionar Estado de Cuenta',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectEstadoDeCuentaProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaMoneyCheck className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={Object.values(EstadoDeCuenta).map(value => ({
        value,
        label: value,
      }))}
    />
  )
}
