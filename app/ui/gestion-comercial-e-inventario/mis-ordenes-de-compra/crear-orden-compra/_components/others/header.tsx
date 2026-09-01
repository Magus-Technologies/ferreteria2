'use client'

import { Tag } from 'antd'
import { TbShoppingCartPlus } from 'react-icons/tb'

import SelectProductos from '~/app/_components/form/selects/select-productos'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import type { RequerimientoInterno } from '~/lib/api/requerimiento-interno'

interface HeaderCrearOrdenCompraProps {
  isEditMode: boolean
  isDuplicateMode: boolean
  reqSeleccionado: RequerimientoInterno | null
}

export default function HeaderCrearOrdenCompra({
  isEditMode,
  isDuplicateMode,
  reqSeleccionado,
}: HeaderCrearOrdenCompraProps) {
  return (
    <div className="w-full">
      <TituloModulos
        title={isEditMode ? 'Editar Orden de Compra' : isDuplicateMode ? 'Duplicar Orden de Compra' : 'Crear Orden de Compra'}
        icon={<TbShoppingCartPlus className="text-cyan-600" />}
      >
        {reqSeleccionado && (
          <div className="flex items-center gap-2 text-sm">
            <Tag color="green">{reqSeleccionado.codigo}</Tag>
            <span className="text-slate-600">{reqSeleccionado.cargo}</span>
          </div>
        )}
      </TituloModulos>

      <div className="-mt-3 mb-4 flex items-center gap-4">
        <SelectProductos
          autoFocus
          allowClear
          size="large"
          className="!min-w-[400px] !w-[400px] !max-w-[400px] font-normal!"
          classNameIcon="text-cyan-600 mx-1"
          classIconSearch="!mb-0"
          classIconPlus="mb-0!"
          withSearch
          withTipoBusqueda
          showButtonCreate
          showCardAgregarProducto
          autoFillPrecioCompraWithCosto
          ignoreAlmacen
          showStockMaxWarning
          showFiltrosAvanzados
        />
      </div>
    </div>
  )
}
