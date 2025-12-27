'use client'

import { Modal } from 'antd'
import { useState } from 'react'
import { TbTruckDelivery } from 'react-icons/tb'
import { MdOutlineLocalShipping } from 'react-icons/md'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import CardAgregarProductoGuia from '../cards/card-agregar-producto-guia'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'

export default function HeaderCrearGuia({
  guia,
}: {
  guia?: any
}) {
  const can = usePermission()

  const [openModalAgregarProducto, setOpenModalAgregarProducto] =
    useState(false)

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  )
  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  )

  return (
    <TituloModulos
      title={`${guia ? 'Editar' : 'Crear'} Guía de Remisión`}
      icon={
        guia ? (
          <MdOutlineLocalShipping className='text-orange-600' />
        ) : (
          <TbTruckDelivery className='text-cyan-600' />
        )
      }
      extra={
        <div className='pl-0 lg:pl-8 flex items-center gap-2 lg:gap-4 w-full lg:w-auto'>
          <SelectProductos
            allowClear
            size='large'
            className='w-full lg:!min-w-[400px] lg:!w-[400px] lg:!max-w-[400px] font-normal!'
            classNameIcon='text-cyan-600 mx-1'
            classIconSearch='!mb-0'
            classIconPlus='mb-0!'
            showButtonCreate={can(permissions.PRODUCTO_CREATE)}
            withSearch
            withTipoBusqueda
            showCardAgregarProductoVenta
            showUltimasCompras={false}
            handleOnlyOneResult={(producto) => {
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
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
        <SelectAlmacen className='w-full' disabled={!!guia} />

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
          width={typeof window !== 'undefined' && window.innerWidth >= 640 ? 300 : '95vw'}
          classNames={{ content: 'min-w-fit' }}
          destroyOnHidden
          maskClosable={false}
          keyboard={false}
        >
          <CardAgregarProductoGuia setOpen={setOpenModalAgregarProducto} />
        </Modal>
      </div>
    </TituloModulos>
  )
}
