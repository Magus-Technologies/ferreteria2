'use client'

import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import { TbShoppingCartPlus } from 'react-icons/tb'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import { permissions } from '~/lib/permissions'
import { Modal } from 'antd'
import CardAgregarProductoCompra from '../cards/card-agregar-producto-compra'
import { useState } from 'react'
import usePermission from '~/hooks/use-permission'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'

export default function HeaderCrearCompra() {
  const can = usePermission()

  const [openModalAgregarProducto, setOpenModalAgregarProducto] =
    useState(false)

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    store => store.setProducto
  )
  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    store => store.producto
  )

  return (
    <TituloModulos
      title='Crear Compra'
      icon={<TbShoppingCartPlus className='text-cyan-600' />}
      extra={
        <div className='pl-8 flex items-center gap-4'>
          <SelectProductos
            allowClear
            size='large'
            className='!min-w-[400px] !w-[400px] !max-w-[400px] font-normal!'
            classNameIcon='text-cyan-600 mx-1'
            classIconSearch='!mb-0'
            classIconPlus='mb-0!'
            showButtonCreate={can(permissions.PRODUCTO_CREATE)}
            withSearch
            withTipoBusqueda
            showCardAgregarProducto
            handleOnlyOneResult={producto => {
              setProductoSeleccionadoSearchStore(producto)
              if (producto) setOpenModalAgregarProducto(true)
            }}
            onChange={(_, producto) => {
              setProductoSeleccionadoSearchStore(producto)
              if (producto) setOpenModalAgregarProducto(true)
            }}
          />
        </div>
      }
    >
      <div className='flex items-center gap-4'>
        <SelectAlmacen className='w-full' />

        <Modal
          open={openModalAgregarProducto}
          onCancel={() => setOpenModalAgregarProducto(false)}
          footer={null}
          title={
            <div className='text-xl font-bold text-left text-balance mb-3'>
              <span className='text-slate-400 block'>AGREGAR:</span>{' '}
              {productoSeleccionadoSearchStore?.name}
            </div>
          }
          width={300}
          classNames={{ content: 'min-w-fit' }}
          destroyOnHidden
          maskClosable={false}
          keyboard={false}
        >
          <CardAgregarProductoCompra setOpen={setOpenModalAgregarProducto} />
        </Modal>
      </div>
    </TituloModulos>
  )
}
