import { Modal } from 'antd'
import InputBase from '../form/inputs/input-base'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonCreateProductoPlus from '../form/buttons/button-create-producto-plus'
import TableProductoSearch, {
  RefTableProductoSearchProps,
} from '../tables/table-producto-search'
import SelectTipoBusquedaProducto, {
  TipoBusquedaProducto,
} from '../form/selects/select-tipo-busqueda-producto'
import CardAgregarProductoCompra from '~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/_components/cards/card-agregar-producto-compra'
import { getProductosResponseProps } from '~/app/_actions/producto'
import TableDetalleDePreciosSearch from '../tables/table-detalle-de-precios-search'
import TableUltimasComprasIngresadasSearch from '../tables/table-ultimas-compras-ingresadas-search'
import CardAgregarProductoVenta from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/cards/card-agregar-producto-venta'
import CardAgregarProductoCotizacion from '~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_components/cards/card-agregar-producto-cotizacion'

type ModalProductoSearchProps = {
  open: boolean
  setOpen: (open: boolean) => void
  textDefault: string
  setTextDefault: (textDefault: string) => void
  tipoBusqueda: TipoBusquedaProducto
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getProductosResponseProps | undefined
  }) => void
  setTipoBusqueda: (tipoBusqueda: TipoBusquedaProducto) => void
  showCardAgregarProducto?: boolean
  showCardAgregarProductoVenta?: boolean
  showCardAgregarProductoCotizacion?: boolean
  showUltimasCompras?: boolean
}

export type CostoUnidadDerivadaSearch = {
  costo: number | undefined | null
  unidad_derivada_id: number | undefined | null
} | null

export default function ModalProductoSearch({
  open,
  setOpen,
  textDefault,
  setTextDefault,
  tipoBusqueda,
  onRowDoubleClicked,
  setTipoBusqueda,
  showCardAgregarProducto = false,
  showCardAgregarProductoVenta = false,
  showCardAgregarProductoCotizacion = false,
  showUltimasCompras = true,
}: ModalProductoSearchProps) {
  const [text, setText] = useState(textDefault)
  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 1000)

  const setProductoSeleccionadoStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
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

  const [costoUnidadDerivada, setCostoUnidadDerivada] =
    useState<CostoUnidadDerivadaSearch>(null)

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
          onChange={(e) => setText(e.target.value)}
          className='max-w-[500px]'
          onPressEnter={() => tableRef.current?.handleRefetch()}
        />
        <ButtonCreateProductoPlus
          className='mb-0!'
          onSuccess={(res) => setText(res.name)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className='flex items-center justify-center gap-8'>
        <div
          className={`${
            showUltimasCompras ? 'h-[600px]' : 'h-[400px]'
          } min-w-[1000px] w-full mt-4`}
        >
          <div
            className={`grid ${
              showUltimasCompras ? 'grid-rows-7' : 'grid-rows-5'
            } gap-y-4 size-full`}
          >
            <div className='row-start-1 row-end-4'>
              <TableProductoSearch
                ref={tableRef}
                value={value}
                onRowDoubleClicked={onRowDoubleClicked}
                tipoBusqueda={tipoBusqueda}
              />
            </div>
            {showUltimasCompras && (
              <div className='row-start-4 row-end-6'>
                <TableUltimasComprasIngresadasSearch />
              </div>
            )}
            <div
              className={
                showUltimasCompras
                  ? 'row-start-6 row-end-8'
                  : 'row-start-4 row-end-6'
              }
            >
              <TableDetalleDePreciosSearch
                costoUnidadDerivada={costoUnidadDerivada}
              />
            </div>
          </div>
        </div>
        {showCardAgregarProducto && (
          <div>
            <CardAgregarProductoCompra
              setOpen={setOpen}
              onChangeValues={(values) => {
                setCostoUnidadDerivada({
                  costo: values.precio_compra,
                  unidad_derivada_id: values.unidad_derivada_id,
                })
              }}
            />
          </div>
        )}
        {showCardAgregarProductoVenta && (
          <div>
            <CardAgregarProductoVenta setOpen={setOpen} />
          </div>
        )}
        {showCardAgregarProductoCotizacion && (
          <div>
            <CardAgregarProductoCotizacion setOpen={setOpen} />
          </div>
        )}
      </div>
    </Modal>
  )
}
