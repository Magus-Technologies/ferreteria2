import { TipoCliente } from '~/lib/api/cliente'
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
        { label: 'Persona', value: TipoCliente.PERSONA },
        { label: 'Empresa', value: TipoCliente.EMPRESA },
      ]}
    />
  )
}
