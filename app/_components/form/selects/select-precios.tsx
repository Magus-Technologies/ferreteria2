import { forwardRef } from 'react'
import SelectBase, { SelectBaseProps, RefSelectBaseProps } from './select-base'
import type { ProductoAlmacenUnidadDerivada } from '~/app/_types/producto'
import { FaMoneyBill } from 'react-icons/fa'

interface SelectPreciosProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  unidadDerivada: ProductoAlmacenUnidadDerivada | undefined | null
  cantidad?: number
}

const precios = [
  { key: 'precio_publico', label: 'P. Público' },
  { key: 'precio_especial', label: 'P. Especial' },
  { key: 'precio_minimo', label: 'P. Mínimo' },
  { key: 'precio_ultimo', label: 'P. Último' },
]

const activadorMap: Record<string, string> = {
  precio_especial: 'activador_especial',
  precio_minimo: 'activador_minimo',
  precio_ultimo: 'activador_ultimo',
}

const SelectPrecios = forwardRef<RefSelectBaseProps, SelectPreciosProps>(function SelectPrecios({
  placeholder = 'Seleccionar Precio',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  unidadDerivada,
  cantidad,
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

              // Verificar activador: si la cantidad no alcanza el umbral, deshabilitar
              const activadorKey = activadorMap[key]
              let disabled = false
              let labelFinal = `${label}: S/. ${precio.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`

              if (activadorKey && cantidad !== undefined) {
                const activador = Number(unidadDerivada[activadorKey as keyof ProductoAlmacenUnidadDerivada] ?? 0)
                if (activador > 0 && cantidad < activador) {
                  disabled = true
                  labelFinal += ` (mín. ${activador})`
                }
              }

              return {
                value: precio,
                label: labelFinal,
                disabled,
              }
            })
          : []
      }
    />
  )
})

export default SelectPrecios
