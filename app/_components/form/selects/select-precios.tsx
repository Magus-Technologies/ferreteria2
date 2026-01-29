import { forwardRef } from 'react'
import SelectBase, { SelectBaseProps, RefSelectBaseProps } from './select-base'
import type { ProductoAlmacenUnidadDerivada } from '~/app/_types/producto'
import { FaMoneyBill } from 'react-icons/fa'

interface SelectPreciosProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  unidadDerivada: ProductoAlmacenUnidadDerivada | undefined | null
}

const precios = [
  { key: 'precio_publico', label: 'P. Público' },
  { key: 'precio_especial', label: 'P. Especial' },
  { key: 'precio_minimo', label: 'P. Mínimo' },
  { key: 'precio_ultimo', label: 'P. Último' },
]

const SelectPrecios = forwardRef<RefSelectBaseProps, SelectPreciosProps>(function SelectPrecios({
  placeholder = 'Seleccionar Precio',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  unidadDerivada,
  ...props
}, ref) {
  return (
    <SelectBase
      {...props}
      ref={ref}
      key={unidadDerivada?.id}
      prefix={<FaMoneyBill className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={
        unidadDerivada
          ? precios.map(({ key, label }) => {
              const precio = Number(
                unidadDerivada[key as keyof ProductoAlmacenUnidadDerivada] ?? 0
              )
              return {
                value: precio,
                label: `${label}: S/. ${precio.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              }
            })
          : []
      }
    />
  )
})

export default SelectPrecios
