'use client'

import { Modal } from 'antd'
import { useRef, useState, useEffect } from 'react'
import { MdPointOfSale } from 'react-icons/md'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectProductos, { type RefSelectProductosProps } from '~/app/_components/form/selects/select-productos'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import CardAgregarProductoCotizacion from '../cards/card-agregar-producto-cotizacion'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { cotizacionesApi } from '~/lib/api/cotizaciones'

export default function HeaderCrearCotizacion() {
  const { can } = usePermissionHook()

  const selectProductosRef = useRef<RefSelectProductosProps>(null)

  const [numeroCotizacion, setNumeroCotizacion] = useState<string>('')

  useEffect(() => {
    const cargarNumero = async () => {
      const response = await cotizacionesApi.getSiguienteNumero()
      if (response.data?.numero) {
        setNumeroCotizacion(response.data.numero)
      }
    }
    cargarNumero()
  }, [])

  const [openModalAgregarProducto, _setOpenModalAgregarProducto] = useState(false)

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  )
  const setSearchText = useStoreProductoSeleccionadoSearch(
    (store) => store.setSearchText
  )
  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  )

  const setOpenModalAgregarProducto = (open: boolean) => {
    _setOpenModalAgregarProducto(open)
    if (!open) setSearchText('')
  }

  const handleAfterCloseModal = () => {
    selectProductosRef.current?.focus()
  }

  return (
    <TituloModulos
      title={numeroCotizacion ? `Crear Cotización — ${numeroCotizacion}` : 'Crear Cotización'}
      icon={<MdPointOfSale className='text-cyan-600' />}
      extra={
        <div className='pl-8 flex items-center gap-4'>
          <div data-select-productos="crear-cotizacion" className="contents">
          <SelectProductos
            ref={selectProductosRef}
            autoFocus
            allowClear
            size='large'
            className='!min-w-[400px] !w-[400px] !max-w-[400px] font-normal!'
            classNameIcon='text-cyan-600 mx-1'
            classIconSearch='!mb-0'
            classIconPlus='mb-0!'
            showButtonCreate={can(permissions.PRODUCTO_CREATE)}
            withSearch
            withTipoBusqueda
            showCardAgregarProductoCotizacion
            showUltimasCompras={false}
            requireSearchToShow
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
        </div>
      }
    >
      <div className='flex items-center gap-4'>
        {/* SelectAlmacen ahora se configura desde el dropdown global de Sucursales */}
        {/* <SelectAlmacen className='w-full' /> */}

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
          focusTriggerAfterClose={false}
          afterClose={handleAfterCloseModal}
        >
          <CardAgregarProductoCotizacion setOpen={setOpenModalAgregarProducto} />
        </Modal>
      </div>
    </TituloModulos>
  )
}
