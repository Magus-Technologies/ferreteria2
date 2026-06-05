import type { Producto } from "~/app/_types/producto";
import { useColumnsProductos } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-productos";
import TableWithTitle from "~/components/tables/table-with-title";
import { TipoBusquedaProducto } from "../form/selects/select-tipo-busqueda-producto";
import { ProductoCreateInputSchema } from "~/types/zod-schemas";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import { useStoreAlmacen } from "~/store/store-almacen";
import { RefObject, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useStoreProductoAgregadoCompra } from "~/app/_stores/store-producto-agregado-compra";
import { useProductosListadoCompleto } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_hooks/useProductosListadoCompleto";
import { usePathname } from "next/navigation";
import { orangeColors, greenColors } from "~/lib/colors";
import { useQuery } from "@tanstack/react-query";
import { productosApiV2 } from "~/lib/api/producto";

export enum FiltroStock {
  TODOS = 'todos',
  STOCK_MINIMO = 'stock_minimo',
  STOCK_CERO = 'stock_cero',
  CON_STOCK = 'con_stock',
}

const STOCK_THRESHOLD = 0.01;

export interface RefTableProductoSearchProps {
  handleRefetch: () => void;
}

export default function TableProductoSearch({
  value,
  onRowDoubleClicked,
  tipoBusqueda,
  ref,
  selectionColor: selectionColorProp,
  isVisible,
  quickFilterValue,
  filtroStock = FiltroStock.TODOS,
  marcaId,
  categoriaId,
  forceLoading = false,
  ignoreAlmacen = false,
  overrideAlmacenId,
  showStockMaxWarning = false,
}: {
  value: string;
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Producto | undefined;
  }) => void;
  tipoBusqueda: TipoBusquedaProducto;
  ref?: RefObject<RefTableProductoSearchProps | null>;
  selectionColor?: string;
  isVisible?: boolean;
  quickFilterValue?: string;
  filtroStock?: FiltroStock;
  marcaId?: number;
  categoriaId?: number;
  forceLoading?: boolean;
  ignoreAlmacen?: boolean;
  overrideAlmacenId?: number;
  showStockMaxWarning?: boolean;
}) {
  const almacen_id_store = useStoreAlmacen((store) => store.almacen_id);
  const almacen_id = overrideAlmacenId ?? almacen_id_store;
  const tableGridRef = useRef<any>(null);
  const searchTerm = value?.trim();
  const isActiveSearch = searchTerm.length >= 2;

  /**
   * Carga TODOS los productos del almacén en un solo request (shape LIGERO
   * del back, cache 10 min). Los filtros se aplican en memoria → búsqueda
   * instantánea sin round-trip.
   *
   * Decisión: ya no usamos `useProductosSearch` (infinite query con paginación).
   * El cliente no quiere paginación, así que cargamos todo de una y filtramos
   * en el cliente. AG Grid con virtualización ya soporta 10k+ filas sin lag.
   */
  // El listado del catálogo SIEMPRE se carga por un almacén de referencia
  // (el endpoint es por almacén). Con `ignoreAlmacen` no queremos filtrar por
  // disponibilidad de stock, pero igual necesitamos un almacén para traer la
  // lista; usamos el almacén actual del store o, en su defecto, el principal (1).
  const almacenIdListado = ignoreAlmacen ? (almacen_id ?? 1) : almacen_id;

  const {
    data: productosCompletos = [],
    isLoading: loading,
    isFetching,
    refetch,
  } = useProductosListadoCompleto(almacenIdListado);

  const {
    data: productosBusquedaRemota = [],
    isLoading: loadingBusquedaRemota,
    isFetching: fetchingBusquedaRemota,
    refetch: refetchBusquedaRemota,
  } = useQuery({
    queryKey: [
      "productos-modal-search",
      almacen_id,
      searchTerm,
      tipoBusqueda,
      marcaId,
      categoriaId,
      filtroStock,
      ignoreAlmacen,
    ],
    queryFn: async () => {
      const response = await productosApiV2.getAllByAlmacen({
        ...(!ignoreAlmacen && almacen_id ? { almacen_id } : {}),
        search: searchTerm,
        estado: 1,
        per_page: 5000,
        ...(marcaId ? { marca_id: marcaId } : {}),
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
      } as any);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data?.data ?? [];
    },
    enabled: isActiveSearch && (ignoreAlmacen || !!almacen_id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  );
  const requestConfirm = useStoreProductoSeleccionadoSearch(
    (store) => store.requestConfirm
  );

  const productosCompra = useStoreProductoAgregadoCompra(
    (store) => store.productos
  );
  const setProductosCompra = useStoreProductoAgregadoCompra(
    (store) => store.setProductos
  );

  /**
   * Filtros en memoria sobre el set cacheado:
   *  1) Excluir productos ya agregados al carrito de compra
   *  2) Filtro de marca y categoría (instantáneo, sin round-trip)
   *  3) Filtro de stock (siempre en front porque el back con el shape LIGERO
   *     no aplica cs_stock, y STOCK_MINIMO necesita el dato del producto)
   *  4) Búsqueda por texto: usa el campo `value` (que viene del Enter del modal)
   *     o el `quickFilterValue` para filtro en vivo (de AG Grid).
   *
   * Para evitar que el filtro se dispare con cada keystroke cuando NO se
   * presionó Enter todavía, exigimos `value.length >= 2` O usamos
   * `quickFilterValue` (que es el filtro en vivo de AG Grid).
   */
  const productosFiltrados = useMemo(() => {
    let productos = isActiveSearch ? productosBusquedaRemota : productosCompletos;

    // 1) Excluir productos ya agregados
    if (productosCompra.length > 0) {
      productos = productos.filter(
        (p) => !productosCompra.find((pc) => pc.producto_id === p.id)
      );
    }

    // 2) Filtros de marca y categoría
    if (marcaId) {
      productos = productos.filter((p) => p.marca_id === marcaId);
    }
    if (categoriaId) {
      productos = productos.filter((p) => p.categoria_id === categoriaId);
    }

    // 3) Filtro de stock
    if (filtroStock !== FiltroStock.TODOS) {
      productos = productos.filter((p) => {
        const productoEnAlmacen = p.producto_en_almacenes?.find(
          (pa) => pa.almacen_id === almacen_id
        );
        const stockActual = Number(productoEnAlmacen?.stock_fraccion ?? 0);

        if (filtroStock === FiltroStock.STOCK_MINIMO) {
          const stockMin = Number(p.stock_min ?? 0);
          return stockActual <= stockMin;
        }
        if (filtroStock === FiltroStock.CON_STOCK) {
          return stockActual >= STOCK_THRESHOLD;
        }
        if (filtroStock === FiltroStock.STOCK_CERO) {
          return stockActual >= 0 && stockActual < STOCK_THRESHOLD;
        }
        return true;
      });
    }

    // 4) Búsqueda por texto (disparada por Enter, value.length >= 2)
    const searchTerm = value?.trim().toLowerCase();
    if (searchTerm && searchTerm.length >= 2) {
      productos = productos.filter((p) => {
        switch (tipoBusqueda) {
          case TipoBusquedaProducto.CODIGO_BARRAS:
            return (p.cod_barra ?? '').toLowerCase().includes(searchTerm);
          case TipoBusquedaProducto.ACCION_TECNICA:
            return (p.accion_tecnica ?? '').toLowerCase().includes(searchTerm);
          case TipoBusquedaProducto.CODIGO_DESCRIPCION:
          default:
            return (
              p.name.toLowerCase().includes(searchTerm) ||

              p.cod_producto.toLowerCase().includes(searchTerm) ||
              (p.cod_barra ?? '').toLowerCase().includes(searchTerm) ||
              (p.name_ticket ?? '').toLowerCase().includes(searchTerm)
            );
        }
      });
    }
    // Sin búsqueda activa: mostrar TODO el set cacheado (5167 productos).
    // AG Grid virtualiza el scroll, así que solo renderiza las filas visibles.
    // El cap anterior (200) era demasiado restrictivo y obligaba al usuario
    // a tipear para ver más — ahora ve el catálogo completo desde el inicio.

    return productos;
  }, [
    isActiveSearch,
    productosBusquedaRemota,
    productosCompletos,
    productosCompra,
    filtroStock,
    almacen_id,
    marcaId,
    categoriaId,
    value,
    tipoBusqueda,
  ]);

  function handleRefetch() {
    setProductosCompra([]);
    refetch();
    if (isActiveSearch) {
      refetchBusquedaRemota();
    }
  }

  useImperativeHandle(ref, () => ({
    handleRefetch: () => handleRefetch(),
  }));

  // Aplicar quickFilter de AG Grid cuando cambia el texto
  useEffect(() => {
    if (tableGridRef.current?.api) {
      tableGridRef.current.api.setGridOption('quickFilterText', quickFilterValue || '');
    }
  }, [quickFilterValue]);

  // Auto-seleccionar el primer producto cuando hay resultados
  useEffect(() => {
    if (!productosFiltrados || productosFiltrados.length === 0) {
      setProductoSeleccionadoSearchStore(undefined);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const trySelect = () => {
      if (cancelled) return;
      const api = tableGridRef.current?.api;
      const firstNode = api?.getDisplayedRowAtIndex(0);
      if (firstNode) {
        const alreadySelected = (api?.getSelectedNodes()?.length ?? 0) > 0;
        if (!alreadySelected) {
          firstNode.setSelected(true);
          setProductoSeleccionadoSearchStore(firstNode.data as any);
        }
        return;
      }
      if (++attempts < maxAttempts) {
        requestAnimationFrame(trySelect);
      }
    };

    requestAnimationFrame(trySelect);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productosFiltrados]);

  const pathname = usePathname();
  const colorSeleccion = selectionColorProp || (
    pathname?.includes('facturacion-electronica')
      ? orangeColors[10]
      : pathname?.includes('gestion-comercial-e-inventario')
        ? greenColors[10]
        : undefined
  );

  return (
    <TableWithTitle<Producto>
      tableRef={tableGridRef}
      id="g-c-e-i.table-producto-search-v2"
      cacheQuickFilter={true}
      quickFilterText={quickFilterValue}
      onSelectionChanged={({ selectedNodes }) => {
        const producto = selectedNodes?.[0]?.data as Producto;
        setProductoSeleccionadoSearchStore(producto as any);
      }}
      onRowClicked={({ data, node }) => {
        node.setSelected(true);
        setProductoSeleccionadoSearchStore(data as any);
        requestConfirm();
      }}
      title="Productos"
      schema={ProductoCreateInputSchema}
      headersRequired={["Ubicación en Almacén"]}
      loading={(isActiveSearch ? loadingBusquedaRemota : loading) || forceLoading}
      columnDefs={useColumnsProductos({
        almacen_id,
        showStockMaxWarning
      }) as any}
      onRowDoubleClicked={({ data }) => {
        setProductoSeleccionadoSearchStore(data as any);
        onRowDoubleClicked?.({ data: data as any });
      }}
      rowData={productosFiltrados}
      selectionColor={colorSeleccion}
      isVisible={isVisible}
      optionsSelectColumns={[
        {
          label: "Default",
          columns: [
            "#",
            "Código de Producto",
            "Producto",
            "U. Contenidas",
            "Marca",
            "Stock",
            "S. Min",
            "Activo",
            "Acciones",
          ],
        },
      ]}
    >
      {(isActiveSearch ? fetchingBusquedaRemota : isFetching) && !(isActiveSearch ? loadingBusquedaRemota : loading) && (
        <div className="text-center py-1 text-[10px] font-medium text-slate-400">
          Sincronizando con el servidor...
        </div>
      )}
    </TableWithTitle>
  );
}
