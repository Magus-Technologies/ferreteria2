import { Modal } from "antd";
import InputBase from "../form/inputs/input-base";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import ButtonCreateProductoPlus from "../form/buttons/button-create-producto-plus";
import TableProductoSearch, {
  RefTableProductoSearchProps,
} from "../tables/table-producto-search";
import SelectTipoBusquedaProducto, {
  TipoBusquedaProducto,
} from "../form/selects/select-tipo-busqueda-producto";
import CardAgregarProductoCompra from "~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/_components/cards/card-agregar-producto-compra";
import { getProductosResponseProps } from "~/app/_actions/producto";
import TableDetalleDePreciosSearch from "../tables/table-detalle-de-precios-search";
import TableUltimasComprasIngresadasSearch from "../tables/table-ultimas-compras-ingresadas-search";
import CardAgregarProductoVenta from "~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/cards/card-agregar-producto-venta";
import CardAgregarProductoCotizacion from "~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_components/cards/card-agregar-producto-cotizacion";
import CardAgregarProductoPrestamo from "~/app/ui/facturacion-electronica/mis-prestamos/crear-prestamo/_components/cards/card-agregar-producto-prestamo";

type ModalProductoSearchProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  textDefault: string;
  setTextDefault: (textDefault: string) => void;
  tipoBusqueda: TipoBusquedaProducto;
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getProductosResponseProps | undefined;
  }) => void;
  setTipoBusqueda: (tipoBusqueda: TipoBusquedaProducto) => void;
  showCardAgregarProducto?: boolean;
  showCardAgregarProductoVenta?: boolean;
  showCardAgregarProductoCotizacion?: boolean;
  showCardAgregarProductoPrestamo?: boolean;
  showUltimasCompras?: boolean;
  selectionColor?: string; // Color para la fila seleccionada
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
  showCardAgregarProductoVenta = false,
  showCardAgregarProductoCotizacion = false,
  showCardAgregarProductoPrestamo = false,
  showUltimasCompras = true,
  selectionColor, // Recibir el color de selección
}: ModalProductoSearchProps) {
  const [text, setText] = useState(textDefault);
  useEffect(() => {
    setText(textDefault);
  }, [textDefault]);

  const [value] = useDebounce(text, 1000);

  const setProductoSeleccionadoStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  );

  useEffect(() => {
    if (open) setProductoSeleccionadoStore(undefined);
    else {
      setTextDefault("");
      setText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const tableRef = useRef<RefTableProductoSearchProps | null>(null);

  const [costoUnidadDerivada, setCostoUnidadDerivada] =
    useState<CostoUnidadDerivadaSearch>(null);

  // Agregar listener para navegación con teclado
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo capturar flechas arriba/abajo cuando NO estamos en un input de texto
      const target = e.target as HTMLElement;
      const isInputText = target.tagName === 'INPUT' && 
        (target as HTMLInputElement).type === 'text';
      
      if (isInputText) return; // Permitir navegación normal en inputs de texto

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // TODO: Implementar navegación en la tabla
        // Por ahora solo prevenimos el comportamiento por defecto
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <Modal
      centered
      width={
        typeof window !== "undefined" && window.innerWidth >= 1280
          ? "fit-content"
          : "98vw"
      }
      open={open}
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
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "calc(100vh - 120px)",
          overflowY: "scroll",
        },
      }}
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
          onPressEnter={() => tableRef.current?.handleRefetch()}
        />
        <ButtonCreateProductoPlus
          className="mb-0! w-full sm:w-auto"
          onSuccess={(res) => setText(res.name)}
          textDefault={text}
          setTextDefault={setText}
        />
      </div>
      <div className="flex flex-col xl:flex-row items-center justify-center gap-4 xl:gap-8">
        <div
          className={`${
            showUltimasCompras ? "h-[600px]" : "h-[400px]"
          } w-full xl:min-w-[1000px] mt-4`}
        >
          <div
            className={`grid ${
              showUltimasCompras ? "grid-rows-7" : "grid-rows-5"
            } gap-y-4 size-full`}
          >
            <div className="row-start-1 row-end-4">
              <TableProductoSearch
                ref={tableRef}
                value={value}
                onRowDoubleClicked={onRowDoubleClicked}
                tipoBusqueda={tipoBusqueda}
                selectionColor={selectionColor}
              />
            </div>
            {showUltimasCompras && (
              <div className="row-start-4 row-end-6">
                <TableUltimasComprasIngresadasSearch />
              </div>
            )}
            <div
              className={
                showUltimasCompras
                  ? "row-start-6 row-end-8"
                  : "row-start-4 row-end-6"
              }
            >
              <TableDetalleDePreciosSearch
                costoUnidadDerivada={costoUnidadDerivada}
              />
            </div>
          </div>
        </div>
        {showCardAgregarProducto && (
          <div className="w-full xl:w-auto">
            <CardAgregarProductoCompra
              setOpen={setOpen}
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
      </div>
    </Modal>
  );
}
