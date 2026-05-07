import type { Producto } from "~/app/_types/producto";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useColumnsProductos } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-productos";
import TableWithTitle from "~/components/tables/table-with-title";
import { TipoBusquedaProducto } from "../form/selects/select-tipo-busqueda-producto";
import { ProductoCreateInputSchema } from "~/types/zod-schemas";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import { useStoreAlmacen } from "~/store/store-almacen";
import { RefObject, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useStoreProductoAgregadoCompra } from "~/app/_stores/store-producto-agregado-compra";
import { useProductosSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_hooks/useProductosSearch";
import { usePathname } from "next/navigation";
import { orangeColors, greenColors } from "~/lib/colors";

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
  selectionColor: selectionColorProp, // Recibir el color como prop
  isVisible, // Prop para saber si el modal está visible
  quickFilterValue, // Filtro local por coincidencia (sobre resultados ya cargados)
  filtroStock = FiltroStock.TODOS,
  marcaId,
  categoriaId,
  forceLoading = false, // Forzar loading externo (ej. debounce pendiente)
  ignoreAlmacen = false,
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
  selectionColor?: string; // Agregar el prop
  isVisible?: boolean; // Prop para saber si el modal está visible
  quickFilterValue?: string; // Filtro local por coincidencia
  filtroStock?: FiltroStock;
  marcaId?: number;
  categoriaId?: number;
  forceLoading?: boolean;
  ignoreAlmacen?: boolean;
  showStockMaxWarning?: boolean;
}) {
  const almacen_id = useStoreAlmacen((store) => store.almacen_id);
  const tableGridRef = useRef<any>(null);

  // Determinar el campo de búsqueda según el tipo
  const getSearchField = () => {
    switch (tipoBusqueda) {
      case TipoBusquedaProducto.CODIGO_BARRAS:
        return 'cod_barra';
      case TipoBusquedaProducto.ACCION_TECNICA:
        return 'accion_tecnica';
      default:
        return 'search'; // Busca en name, cod_producto, cod_barra
    }
  };

  const hasSearch = !!value;
  // Siempre permitir búsqueda (con o sin texto)
  const shouldFetch = true;

  // Mapear filtro de stock a parámetro del backend cuando sea posible
  const getBackendStockFilterValue = (filtro: FiltroStock) => {
    switch (filtro) {
      case FiltroStock.CON_STOCK:
        return 'con_stock';
      case FiltroStock.STOCK_CERO:
        return 'sin_stock';
      default:
        return 'all';
    }
  };

  const {
    data: response,
    refetch,
    loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductosSearch({
    filtros: {
      almacen_id: ignoreAlmacen ? undefined : almacen_id,
      // Si es búsqueda por código de barras o acción técnica, usar el campo específico
      ...(tipoBusqueda === TipoBusquedaProducto.CODIGO_BARRAS && value
        ? { search: value } // El backend busca en cod_barra también
        : {}),
      ...(tipoBusqueda === TipoBusquedaProducto.ACCION_TECNICA && value
        ? { accion_tecnica: value }
        : {}),
      ...(tipoBusqueda === TipoBusquedaProducto.CODIGO_DESCRIPCION && value
        ? { search: value } // Busca en name, cod_producto, cod_barra
        : {}),
      estado: 1, // Solo productos activos
      ...(marcaId ? { marca_id: marcaId } : {}),
      ...(categoriaId ? { categoria_id: categoriaId } : {}),
      cs_stock: ignoreAlmacen
        ? 'all'
        : (filtroStock === FiltroStock.STOCK_MINIMO ? 'all' : getBackendStockFilterValue(filtroStock)),
      per_page: 250,
    },
    // Siempre habilitado
    enabled: shouldFetch,
  });

  // Handler para detectar scroll al final de la tabla y cargar más datos
  const onBodyScroll = (event: any) => {
    if (!hasNextPage || isFetchingNextPage) return;

    const api = event.api;
    // Obtener el índice de la última fila visible
    const lastVisibleIndex = api.getLastDisplayedRowIndex();
    // Obtener el total de filas mostradas
    const totalRows = api.getDisplayedRowCount();

    // Si estamos cerca del final (ej. quedan 10 filas o menos para llegar al tope actual)
    if (lastVisibleIndex >= totalRows - 10) {
      fetchNextPage();
    }
  };

  type ResponseItem = Producto;

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

  const productosFiltrados = useMemo(() => {
    let productos = (response || []).filter(
      (producto) =>
        !productosCompra.find(
          (producto_compra) => producto_compra.producto_id === producto.id
        )
    );

    // Aplicar filtros de STOCK en el frontend
    // 1. STOCK_MINIMO siempre se filtra en el frontend
    // 2. Si ignoreAlmacen es true, los filtros de stock del backend no funcionan, así que los hacemos aquí
    const esFiltroFrontend =
      filtroStock === FiltroStock.STOCK_MINIMO ||
      filtroStock === FiltroStock.CON_STOCK ||
      filtroStock === FiltroStock.STOCK_CERO ||
      ignoreAlmacen;

    if (esFiltroFrontend && filtroStock !== FiltroStock.TODOS) {
      productos = productos.filter((producto) => {
        // Obtener el stock actual del almacén actual
        const productoEnAlmacen = producto.producto_en_almacenes?.find(
          (pa) => pa.almacen_id === almacen_id
        );
        const stockActual = Number(productoEnAlmacen?.stock_fraccion ?? 0);

        if (filtroStock === FiltroStock.STOCK_MINIMO) {
          const stockMin = Number(producto.stock_min ?? 0);
          return stockActual <= stockMin;
        }

        if (filtroStock === FiltroStock.CON_STOCK) {
          return stockActual >= STOCK_THRESHOLD;
        }

        if (filtroStock === FiltroStock.STOCK_CERO) {
          return stockActual < STOCK_THRESHOLD;
        }

        return true;
      });
    }

    return productos;
  }, [response, productosCompra, filtroStock, almacen_id]);

  function handleRefetch() {
    refetch();
  }

  // Refetch cuando cambian los filtros
  const filtroStockRef = useRef(filtroStock);
  const marcaIdRef = useRef(marcaId);
  const categoriaIdRef = useRef(categoriaId);

  useEffect(() => {
    const filtroChanged = filtroStockRef.current !== filtroStock;
    const marcaChanged = marcaIdRef.current !== marcaId;
    const categoriaChanged = categoriaIdRef.current !== categoriaId;

    if (filtroChanged || marcaChanged || categoriaChanged) {
      // Calcular valores para el backend ANTES de actualizar los refs
      const backendStockAnterior = ignoreAlmacen ? 'all' : (filtroStockRef.current === FiltroStock.STOCK_MINIMO ? 'all' : getBackendStockFilterValue(filtroStockRef.current));
      const backendStockNuevo = ignoreAlmacen ? 'all' : (filtroStock === FiltroStock.STOCK_MINIMO ? 'all' : getBackendStockFilterValue(filtroStock));

      const elStockCambiaEnBackend = backendStockAnterior !== backendStockNuevo;

      // Actualizar los refs
      filtroStockRef.current = filtroStock;
      marcaIdRef.current = marcaId;
      categoriaIdRef.current = categoriaId;

      if (isVisible && (elStockCambiaEnBackend || marcaChanged || categoriaChanged)) {
        handleRefetch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStock, marcaId, categoriaId, isVisible]);

  // Aplicar quickFilter local cuando cambia el texto
  useEffect(() => {
    if (tableGridRef.current?.api) {
      tableGridRef.current.api.setGridOption('quickFilterText', quickFilterValue || '');
    }
  }, [quickFilterValue]);

  // Seleccionar automáticamente el primer producto cuando cambian los datos.
  //
  // Hay un caso sutil con React Query: cuando el modal se cierra y reabre con
  // la MISMA query (ej. "GLOS" 2 veces), la respuesta sale del cache y
  // productosFiltrados ya tiene datos en el primer render. El requestAnimationFrame
  // dispara un solo frame después, pero AG Grid aún no terminó de inicializar
  // su `api`, así que firstNode es undefined y la selección no ocurre.
  //
  // Solución: reintentar varios frames hasta que la api de AG Grid responda.
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
        firstNode.setSelected(true);
        setProductoSeleccionadoSearchStore(firstNode.data as any);
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

  useImperativeHandle(ref, () => ({
    handleRefetch: () => handleRefetch(),
  }));

  const pathname = usePathname();
  // Usar el color pasado como prop, o detectar automáticamente
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
        // Con 1 click: seleccionar la fila + solicitar focus en cantidad
        node.setSelected(true);
        setProductoSeleccionadoSearchStore(data as any);
        requestConfirm();
      }}
      title="Productos"
      schema={ProductoCreateInputSchema}
      headersRequired={["Ubicación en Almacén"]}
      loading={loading || forceLoading}
      columnDefs={useColumnsProductos({
        almacen_id,
        showStockMaxWarning
      }) as any}
      onRowDoubleClicked={({ data }) => {
        // Con 2 clicks: actualizar el producto Y ejecutar la acción adicional (abrir modal)
        setProductoSeleccionadoSearchStore(data as any);
        onRowDoubleClicked?.({ data: data as any });
      }}
      onBodyScroll={onBodyScroll}
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
      {isFetchingNextPage && (
        <div className="text-center py-2 text-xs font-medium text-emerald-600 animate-pulse bg-emerald-50/50 rounded-b-xl border-t border-emerald-100">
          Cargando más productos...
        </div>
      )}
    </TableWithTitle>
  );
}
