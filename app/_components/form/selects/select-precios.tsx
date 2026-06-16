import { forwardRef } from 'react'
import SelectBase, { SelectBaseProps, RefSelectBaseProps } from './select-base'
import type { ProductoAlmacenUnidadDerivada } from '~/app/_types/producto'
import { FaMoneyBill } from 'react-icons/fa'

interface SelectPreciosProps extends Omit<SelectBaseProps, 'onChange' | 'value'> {
  classNameIcon?: string
  sizeIcon?: number
  unidadDerivada: ProductoAlmacenUnidadDerivada | undefined | null
  cantidad?: number
  onChange?: (precio: number, key: string) => void
  value?: string | null // key del precio seleccionado (precio_publico, precio_especial, etc.)
}

const precios = [
  { key: 'precio_publico', label: 'PRECIO Público' },
  { key: 'precio_especial', label: 'PRECIO Ferreteria' },
  { key: 'precio_minimo', label: 'PRECIO Mínimo' },
  { key: 'precio_ultimo', label: 'PRECIO Final' },
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
  onChange,
  value,
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
      value={value}
      onChange={(key: string) => {
        if (!unidadDerivada || !onChange) return
        const precio = Number(unidadDerivada[key as keyof ProductoAlmacenUnidadDerivada] ?? 0)
        onChange(precio, key)
      }}
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

              if (activadorKey) {
                const activador = Number(unidadDerivada[activadorKey as keyof ProductoAlmacenUnidadDerivada] ?? 0)
                if (activador > 0) {
                  labelFinal += ` (${activador} und)`
                  if (cantidad !== undefined && cantidad < activador) {
                    disabled = true
                  }
                }
              }

              return {
                value: key,
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
