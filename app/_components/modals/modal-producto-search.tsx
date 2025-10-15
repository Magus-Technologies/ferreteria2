import { Modal } from 'antd'
import InputBase from '../form/inputs/input-base'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { TableProductosProps } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-productos'
import ButtonCreateProductoPlus from '../form/buttons/button-create-producto-plus'
import TableProductoSearch, {
  RefTableProductoSearchProps,
} from '../tables/table-producto-search'
import SelectTipoBusquedaProducto, {
  TipoBusquedaProducto,
} from '../form/selects/select-tipo-busqueda-producto'
import CardAgregarProductoCompra from '~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/_components/cards/card-agregar-producto-compra'

type ModalProductoSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  textDefault: string
  setTextDefault: (textDefault: string) => void
  tipoBusqueda: TipoBusquedaProducto
  onRowDoubleClicked?: ({
    data,
  }: {
    data: TableProductosProps | undefined
  }) => void
  setTipoBusqueda: (tipoBusqueda: TipoBusquedaProducto) => void
}

export default function ModalProductoSearch({
  open,
  setOpen,
  textDefault,
  setTextDefault,
  tipoBusqueda,
  onRowDoubleClicked,
  setTipoBusqueda,
}: ModalProductoSearchProps) {
  const [text, setText] = useState(textDefault)
  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 1000)

  const setProductoSeleccionadoStore = useStoreProductoSeleccionadoSearch(
    store => store.setProducto
  )

  useEffect(() => {
    if (open) setProductoSeleccionadoStore(undefined)
    else {
      setTextDefault('')
      setText('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const tableRef = useRef<RefTableProductoSearchProps | null>(null)

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Producto'}
      okText={'Seleccionar'}
      cancelText='Cerrar'
      footer={null}
      onCancel={() => {
        setOpen(false)
      }}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      <div className='flex items-center gap-2'>
        <SelectTipoBusquedaProducto
          className='!min-w-[180px] !w-[180px] !max-w-[180px]'
          onChange={setTipoBusqueda}
          value={tipoBusqueda}
        />
        <InputBase
          placeholder='Buscar Producto'
          value={text}
          onChange={e => setText(e.target.value)}
          className='max-w-[500px]'
          onPressEnter={() => tableRef.current?.handleRefetch()}
        />
        <ButtonCreateProductoPlus
          className='mb-0!'
          onSuccess={res => setText(res.name)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='flex items-center justify-center gap-8'>
        <div className='h-[500px] min-w-[1000px] w-full mt-4'>
          <TableProductoSearch
            ref={tableRef}
            value={value}
            onRowDoubleClicked={onRowDoubleClicked}
            tipoBusqueda={tipoBusqueda}
          />
        </div>
        <div>
          <CardAgregarProductoCompra setOpen={setOpen} />
        </div>
      </div>
    </Modal>
  )
}
