import SelectBase, { SelectBaseProps } from './select-base'
import { DescuentoTipo, TipoMoneda } from '@prisma/client'

interface SelectDescuentoTipoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  tipoMoneda?: TipoMoneda
}

export default function SelectDescuentoTipo({
  variant = 'filled',
  tipoMoneda = TipoMoneda.Soles,
  className = 'w-[60px]! min-w-[60px]! max-w-[60px]!',
  ...props
}: SelectDescuentoTipoProps) {
  return (
    <SelectBase
      {...props}
      className={className}
      variant={variant}
      defaultValue={DescuentoTipo.Monto}
      options={[
        {
          value: DescuentoTipo.Monto,
          label: tipoMoneda === TipoMoneda.Soles ? 'S/.' : '$.',
        },
        { value: DescuentoTipo.Porcentaje, label: '%' },
      ]}
    />
  )
}
