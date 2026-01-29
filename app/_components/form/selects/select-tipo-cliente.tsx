import { TipoCliente } from '@prisma/client'
import SelectBase, { SelectBaseProps } from './select-base'

export default function SelectTipoCliente({
  variant = 'filled',
  ...props
}: SelectBaseProps) {
  return (
    <SelectBase
      {...props}
      variant={variant}
      options={[
        { label: TipoCliente.Persona, value: TipoCliente.Persona },
        { label: TipoCliente.Empresa, value: TipoCliente.Empresa },
      ]}
    />
  )
}
