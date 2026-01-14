import SelectBase, { SelectBaseProps } from './select-base'
import { DescuentoTipo } from '~/lib/api/venta'

interface SelectDescuentoTipoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  tipoMoneda?: 's' | 'd'
}

export default function SelectDescuentoTipo({
  variant = 'filled',
  tipoMoneda = 's',
  className = 'w-[60px]! min-w-[60px]! max-w-[60px]!',
  ...props
}: SelectDescuentoTipoProps) {
  return (
    <SelectBase
      {...props}
      className={className}
      variant={variant}
      defaultValue={DescuentoTipo.MONTO}
      options={[
        {
          value: DescuentoTipo.MONTO,
          label: tipoMoneda === 's' ? 'S/.' : '$.',
        },
        { value: DescuentoTipo.PORCENTAJE, label: '%' },
      ]}
    />
  )
}
