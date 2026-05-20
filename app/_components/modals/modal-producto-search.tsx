import { Modal } from "antd";
import InputBase from "../form/inputs/input-base";
import SelectBase from "../form/selects/select-base";
import { useEffect, useRef, useState } from "react";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import ButtonCreateProductoPlus from "../form/buttons/button-create-producto-plus";
import TableProductoSearch, {
  RefTableProductoSearchProps,
  FiltroStock,
} from "../tables/table-producto-search";
import SelectTipoBusquedaProducto, {
  TipoBusquedaProducto,
} from "../form/selects/select-tipo-busqueda-producto";
import CardAgregarProductoCompra from "~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/_components/cards/card-agregar-producto-compra";
import type { Producto } from "~/app/_types/producto";
import TableDetalleDePreciosSearch from "../tables/table-detalle-de-precios-search";
import TableUltimasComprasIngresadasSearch from "../tables/table-ultimas-compras-ingresadas-search";
import CardAgregarProductoVenta from "~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/cards/card-agregar-producto-venta";
import CardAgregarProductoCotizacion from "~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_components/cards/card-agregar-producto-cotizacion";
import CardAgregarProductoPrestamo from "~/app/ui/facturacion-electronica/mis-prestamos/crear-prestamo/_components/cards/card-agregar-producto-prestamo";
import CardAgregarProductoGuia from "~/app/ui/facturacion-electronica/mis-guias/crear-guia/_components/cards/card-agregar-producto-guia";
import CardAgregarProductoTransferencia from "~/app/ui/gestion-comercial-e-inventario/mis-transferencias/_components/cards/card-agregar-producto-transferencia";
import { marcasApi, categoriasApi } from "~/lib/api/catalogos";
import { useQuery } from "@tanstack/react-query";

type ModalProductoSearchProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  textDefault: string;
  setTextDefault: (textDefault: string) => void;
  tipoBusqueda: TipoBusquedaProducto;
  onRowDoubleClicked?: ({ data }: { data: Producto | undefined }) => void;
  setTipoBusqueda: (tipoBusqueda: TipoBusquedaProducto) => void;
  showCardAgregarProducto?: boolean;
  autoFillPrecioCompraWithCosto?: boolean;
  showCardAgregarProductoVenta?: boolean;
  showCardAgregarProductoCotizacion?: boolean;
  showCardAgregarProductoPrestamo?: boolean;
  showCardAgregarProductoGuia?: boolean;
  showCardAgregarProductoTransferencia?: boolean;
  almacenOrigenIdTransferencia?: number;
  showUltimasCompras?: boolean;
  selectionColor?: string; // Color para la fila seleccionada
  onAfterClose?: () => void;
  ignoreAlmacen?: boolean;
  overrideAlmacenId?: number;
  showStockMaxWarning?: boolean;
  showFiltrosAvanzados?: boolean;
  stockFilterMode?: 'default' | 'venta';
};

export type CostoUnidadDerivadaSearch = {
  costo: number | undefined | null;
  unidad_derivada_id: number | undefined | null;
} | null;

export default function ModalProductoSearch({
  open,
  setOpen,
  textDefault,
  setTextDefault,
  tipoBusqueda,
  onRowDoubleClicked,
  setTipoBusqueda,
  showCardAgregarProducto = false,
  autoFillPrecioCompraWithCosto = false,
  showCardAgregarProductoVenta = false,
  showCardAgregarProductoCotizacion = false,
  showCardAgregarProductoPrestamo = false,
  showCardAgregarProductoGuia = false,
  showCardAgregarProductoTransferencia = false,
  almacenOrigenIdTransferencia,
  showUltimasCompras = true,
  selectionColor, // Recibir el color de selección
  onAfterClose,
  ignoreAlmacen = false,
  overrideAlmacenId,
  showStockMaxWarning = false,
  showFiltrosAvanzados = false,
  stockFilterMode = 'default',
}: ModalProductoSearchProps) {
  const [text, setText] = useState(textDefault);
  useEffect(() => {
    setText(textDefault);
  }, [textDefault]);

  // value: solo se actualiza al presionar Enter (o click en lupa) → dispara fetch.
  // text: lo que el user escribe, no genera petición automática.
  const [value, setValue] = useState(textDefault);
  useEffect(() => {
    setValue(textDefault);
  }, [textDefault]);

  const setProductoSeleccionadoStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto,
  );
  const requestConfirm = useStoreProductoSeleccionadoSearch(
    (store) => store.requestConfirm,
  );

  const [filtroStock, setFiltroStock] = useState<FiltroStock>(FiltroStock.TODOS);
  const [marcaId, setMarcaId] = useState<number | undefined>(undefined);
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);

  // Cargar marcas
  const { data: marcasResponse } = useQuery({
    queryKey: ['marcas', 'activas'],
    queryFn: async () => {
      const response = await marcasApi.getAll({ estado: true });
      return response.data?.data || [];
    },
  });

  // Cargar categorías
  const { data: categoriasResponse } = useQuery({
    queryKey: ['categorias', 'activas'],
    queryFn: async () => {
      const response = await categoriasApi.getAll({ estado: true });
      return response.data?.data || [];
    },
  });

  useEffect(() => {
    if (open) setProductoSeleccionadoStore(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const tableRef = useRef<RefTableProductoSearchProps | null>(null);

  const [costoUnidadDerivada, setCostoUnidadDerivada] =
    useState<CostoUnidadDerivadaSearch>(null);

  const handleSearchEnter = () => {
    // Si el texto es igual al valor actual, forzar un refetch
    if (text === value) {
      if (tableRef.current) {
        tableRef.current.handleRefetch();
      }
    } else {
      // Si es diferente, actualizar value para que React Query dispare la búsqueda
      setValue(text);
      setTextDefault(text);
    }
  };

  return (
    <Modal
      centered
      width={
        typeof window !== "undefined" && window.innerWidth >= 1280
          ? "70vw"
          : "98vw"
      }
      open={open}
      destroyOnHidden
      classNames={{ content: "min-w-fit xl:min-w-0" }}
      title={"Buscar Producto"}
      okText={"Seleccionar"}
      cancelText="Cerrar"
      footer={null}
      onCancel={() => {
        setOpen(false);
      }}
      maskClosable={false}
      keyboard={false}
      focusTriggerAfterClose={false}
      afterClose={onAfterClose}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <SelectTipoBusquedaProducto
          className="w-full sm:!min-w-[180px] sm:!w-[180px] sm:!max-w-[180px]"
          onChange={setTipoBusqueda}
          value={tipoBusqueda}
        />
        <InputBase
          placeholder="Buscar Producto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full sm:max-w-[500px]"
          onPressEnter={handleSearchEnter}
        />
        {stockFilterMode === 'venta' && (
          <SelectBase
            placeholder="Filtro Stock"
            value={filtroStock}
            onChange={(value) => setFiltroStock(value as FiltroStock)}
            className="w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]"
            options={[
              { value: FiltroStock.TODOS, label: 'Todos' },
              { value: FiltroStock.CON_STOCK, label: 'Con Stock' },
            ]}
          />
        )}
        {stockFilterMode !== 'venta' && (
        <SelectBase
          placeholder="Filtro Stock"
          value={filtroStock}
          onChange={(value) => setFiltroStock(value as FiltroStock)}
          className="w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]"
          options={[
            { value: FiltroStock.TODOS, label: 'Todos' },
            { value: FiltroStock.STOCK_MINIMO, label: 'Stock Mínimo' },
            { value: FiltroStock.STOCK_CERO, label: 'Stock Cero' },
            { value: FiltroStock.CON_STOCK, label: 'Con Stock' },
          ]}
        />
        )}
        {showFiltrosAvanzados && (
          <>
            <SelectBase
              placeholder="Marca"
              value={marcaId}
              onChange={(value) => setMarcaId(value as number | undefined)}
              className="w-full sm:!min-w-[180px] sm:!w-[180px] sm:!max-w-[180px]"
              allowClear
              options={[
                { value: undefined, label: 'Todas' },
                ...(marcasResponse || []).map((marca) => ({
                  value: marca.id,
                  label: marca.name,
                })),
              ]}
            />
            <SelectBase
              placeholder="Categoría"
              value={categoriaId}
              onChange={(value) => setCategoriaId(value as number | undefined)}
              className="w-full sm:!min-w-[180px] sm:!w-[180px] sm:!max-w-[180px]"
              allowClear
              options={[
                { value: undefined, label: 'Todas' },
                ...(categoriasResponse || []).map((categoria) => ({
                  value: categoria.id,
                  label: categoria.name,
                })),
              ]}
            />
          </>
        )}
        <ButtonCreateProductoPlus
          className="mb-0! w-full sm:w-auto"
          onSuccess={(res) => setText(res.name)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className="flex flex-col xl:flex-row items-start justify-center gap-4 xl:gap-8">
        <div
          className={`${
            showUltimasCompras ? "h-[600px]" : "h-[400px]"
          } w-full xl:flex-1 xl:min-w-0 mt-4`}
        >
          <div
            className={`grid ${
              showUltimasCompras ? "grid-rows-7" : "grid-rows-5"
            } gap-y-4 size-full`}
          >
            <div className="row-start-1 row-end-4 min-h-0 flex flex-col">
              <TableProductoSearch
                ref={tableRef}
                value={value}
                quickFilterValue={value}
                onRowDoubleClicked={onRowDoubleClicked}
                tipoBusqueda={tipoBusqueda}
                selectionColor={selectionColor}
                isVisible={open}
                filtroStock={filtroStock}
                marcaId={marcaId}
                categoriaId={categoriaId}
                ignoreAlmacen={ignoreAlmacen}
                overrideAlmacenId={almacenOrigenIdTransferencia ?? overrideAlmacenId}
                showStockMaxWarning={showStockMaxWarning}
              />
            </div>
            {showUltimasCompras && (
              <div className="row-start-4 row-end-6 min-h-0 flex flex-col">
                <TableUltimasComprasIngresadasSearch />
              </div>
            )}
            <div
              className={
                showUltimasCompras
                  ? "row-start-6 row-end-8 min-h-0 flex flex-col"
                  : "row-start-4 row-end-6 min-h-0 flex flex-col"
              }
            >
              <TableDetalleDePreciosSearch
                costoUnidadDerivada={costoUnidadDerivada}
              />
            </div>
          </div>
        </div>
        {showCardAgregarProducto && (
          <div className="w-full xl:w-[300px] xl:flex-shrink-0 mt-4">
            <CardAgregarProductoCompra
              setOpen={setOpen}
              autoFillPrecioCompraWithCosto={autoFillPrecioCompraWithCosto}
              showStockMaxWarning={showStockMaxWarning}
              onChangeValues={(values) => {
                setCostoUnidadDerivada({
                  costo: values.precio_compra,
                  unidad_derivada_id: values.unidad_derivada_id,
                });
              }}
            />
          </div>
        )}
        {showCardAgregarProductoVenta && (
          <div className="w-full xl:w-auto">
            <CardAgregarProductoVenta setOpen={setOpen} />
          </div>
        )}
        {showCardAgregarProductoCotizacion && (
          <div className="w-full xl:w-auto">
            <CardAgregarProductoCotizacion setOpen={setOpen} />
          </div>
        )}
        {showCardAgregarProductoPrestamo && (
          <div className="w-full xl:w-auto">
            <CardAgregarProductoPrestamo setOpen={setOpen} />
          </div>
        )}
        {showCardAgregarProductoGuia && (
          <div className="w-full xl:w-auto">
            <CardAgregarProductoGuia setOpen={setOpen} withMasYSalir />
          </div>
        )}
        {showCardAgregarProductoTransferencia && (
          <div className="w-full xl:w-auto">
            <CardAgregarProductoTransferencia
              setOpen={setOpen}
              almacenOrigenId={almacenOrigenIdTransferencia}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
