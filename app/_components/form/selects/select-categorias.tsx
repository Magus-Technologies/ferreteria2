import { BiSolidCategoryAlt } from 'react-icons/bi'
import SelectBase, { SelectBaseProps } from './select-base'

interface SelectCategoriasProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export default function SelectCategorias({
  placeholder = 'Seleccionar Categoría',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  ...props
}: SelectCategoriasProps) {
  return (
    <SelectBase
      {...props}
      prefix={<BiSolidCategoryAlt className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={[
        { value: 'categoria-1', label: 'Categoria 1' },
        { value: 'categoria-2', label: 'Categoria 2' },
      ]}
    />
  )
}
