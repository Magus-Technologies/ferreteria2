import SelectBase, { SelectBaseProps } from './select-base'

interface SelectTipoBusquedaProductoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
}

export enum TipoBusquedaProducto {
  CODIGO_DESCRIPCION = 'codigo_descripcion',
  CODIGO_BARRAS = 'codigo_barras',
  ACCION_TECNICA = 'accion_tecnica',
}

export default function SelectTipoBusquedaProducto({
  placeholder = 'Tipo de Busqueda',
  variant = 'filled',
  ...props
}: SelectTipoBusquedaProductoProps) {
  return (
    <SelectBase
      {...props}
      variant={variant}
      placeholder={placeholder}
      defaultValue={TipoBusquedaProducto.CODIGO_DESCRIPCION}
      options={[
        {
          value: TipoBusquedaProducto.CODIGO_DESCRIPCION,
          label: 'Código / Descripción',
        },
        {
          value: TipoBusquedaProducto.CODIGO_BARRAS,
          label: 'Código de Barras',
        },
        { value: TipoBusquedaProducto.ACCION_TECNICA, label: 'Acción Técnica' },
      ]}
    />
  )
}
