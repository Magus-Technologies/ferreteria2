'use client'

import { Modal } from 'antd'
import { useState } from 'react'
import { MdOutlineSell, MdSell } from 'react-icons/md'
import { getVentaResponseProps } from '~/app/_actions/venta'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

export type VentaConUnidadDerivadaNormal = Omit<
  getVentaResponseProps,
  'productos_por_almacen'
> & {
  productos_por_almacen: (Omit<
    getVentaResponseProps['productos_por_almacen'][number],
    'unidades_derivadas'
  > & {
    unidades_derivadas: (getVentaResponseProps['productos_por_almacen'][number]['unidades_derivadas'][number] & {
      unidad_derivada_normal: getVentaResponseProps['productos_por_almacen'][number]['unidades_derivadas'][number]['unidad_derivada_inmutable']
    })[]
  })[]
}

export default function HeaderCrearVenta({
  venta,
}: {
  venta?: VentaConUnidadDerivadaNormal
}) {
  const can = usePermission()

  const [openModalAgregarProducto, setOpenModalAgregarProducto] =
    useState(false)

  return (
    <TituloModulos
      title={`${venta ? 'Editar' : 'Crear'} Venta`}
      icon={
        venta ? (
          <MdOutlineSell className='text-orange-600' />
        ) : (
          <MdSell className='text-cyan-600' />
        )
      }
      extra={
        // (compra?._count?.recepciones_almacen ?? 0) > 0 ||
        // (compra?._count?.pagos_de_compras ?? 0) > 0
        //   ? null
        //   : (
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
            showCardAgregarProductoVenta
            showUltimasCompras={false}
            //   handleOnlyOneResult={producto => {
            //     setProductoSeleccionadoSearchStore(producto)
            //     if (producto) setOpenModalAgregarProducto(true)
            //   }}
            //   onChange={(_, producto) => {
            //     setProductoSeleccionadoSearchStore(producto)
            //     if (producto) setOpenModalAgregarProducto(true)
            //   }}
          />
        </div>
        // )
      }
    >
      <div className='flex items-center gap-4'>
        <SelectAlmacen className='w-full' disabled={!!venta} />

        <Modal
          open={openModalAgregarProducto}
          onCancel={() => setOpenModalAgregarProducto(false)}
          footer={null}
          title={
            <div className='text-xl font-bold text-left text-balance mb-3'>
              <span className='text-slate-400 block'>AGREGAR:</span>{' '}
              {/* {productoSeleccionadoSearchStore?.name} */}
            </div>
          }
          width={300}
          classNames={{ content: 'min-w-fit' }}
          destroyOnHidden
          maskClosable={false}
          keyboard={false}
        >
          {/* <CardAgregarProductoCompra setOpen={setOpenModalAgregarProducto} /> */}
        </Modal>
      </div>
    </TituloModulos>
  )
}
