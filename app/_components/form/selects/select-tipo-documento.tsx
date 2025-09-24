import SelectBase, { SelectBaseProps } from './select-base'
import { FaFileInvoice } from 'react-icons/fa6'
import { TipoDocumento } from '@prisma/client'

interface SelectTipoDocumentoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectTipoDocumento({
  placeholder = 'Seleccionar Tipo de Documento',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  ...props
}: SelectTipoDocumentoProps) {
  return (
    <SelectBase
      {...props}
      prefix={<FaFileInvoice className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={Object.values(TipoDocumento)
        .filter(
          value =>
            value !== TipoDocumento.Ingreso && value !== TipoDocumento.Salida
        )
        .map(value => ({
          value,
          label: value == TipoDocumento.NotaDeVenta ? 'Nota de Venta' : value,
        }))}
    />
  )
}
