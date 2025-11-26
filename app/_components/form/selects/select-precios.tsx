import SelectBase, { SelectBaseProps } from './select-base'
import { ProductoAlmacenUnidadDerivada } from '@prisma/client'
import { FaMoneyBill } from 'react-icons/fa'

interface SelectPreciosProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  unidadDerivada: ProductoAlmacenUnidadDerivada | undefined | null
}

const precios = [
  'precio_publico',
  'precio_especial',
  'precio_minimo',
  'precio_ultimo',
]

export default function SelectPrecios({
  placeholder = 'Seleccionar Precio',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  unidadDerivada,
  ...props
}: SelectPreciosProps) {
  return (
    <SelectBase
      {...props}
      key={unidadDerivada?.id}
      prefix={<FaMoneyBill className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={
        unidadDerivada
          ? precios.map((value) => ({
              value:
                Number(
                  unidadDerivada[value as keyof ProductoAlmacenUnidadDerivada]
                ) ?? 0,
              label: `${Number(
                unidadDerivada[value as keyof ProductoAlmacenUnidadDerivada] ??
                  0
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}`,
            }))
          : []
      }
    />
  )
}
