import SelectBase, { SelectBaseProps } from './select-base'
import { FaFileInvoice } from 'react-icons/fa6'

interface SelectTipoDocumentoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

// Tipos de documento con códigos SUNAT
const TIPOS_DOCUMENTO = [
  { value: '01', label: 'Factura' },
  { value: '03', label: 'Boleta' },
  { value: 'nv', label: 'Nota de Venta' },
]

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
      options={TIPOS_DOCUMENTO}
    />
  )
}
