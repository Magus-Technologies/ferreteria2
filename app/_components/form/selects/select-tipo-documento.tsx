import SelectBase, { SelectBaseProps } from './select-base'
import { FaFileInvoice } from 'react-icons/fa6'

interface SelectTipoDocumentoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  withTodos?: boolean
}

// Tipos de documento con códigos SUNAT
const TIPOS_DOCUMENTO = [
  // { value: '', label: 'Todos' },
  { value: '01', label: 'Factura' },
  { value: '03', label: 'Boleta' },
  { value: 'nv', label: 'Nota de Venta' },
]

export default function SelectTipoDocumento({
  placeholder = 'Seleccionar Tipo de Documento',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  withTodos = false,
  ...props
}: SelectTipoDocumentoProps) {
  const options = withTodos 
    ? [{ value: 'todos', label: 'Todos' }, ...TIPOS_DOCUMENTO] 
    : TIPOS_DOCUMENTO

  return (
    <SelectBase
      {...props}
      prefix={<FaFileInvoice className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={options}
    />
  )
}
