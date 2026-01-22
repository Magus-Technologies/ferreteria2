import { getProductosResponseProps } from "~/app/_actions/producto";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useColumnsProductos } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-productos";
import TableWithTitle from "~/components/tables/table-with-title";
import { TipoBusquedaProducto } from "../form/selects/select-tipo-busqueda-producto";
import { ProductoCreateInputSchema } from "~/prisma/generated/zod";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import { useStoreAlmacen } from "~/store/store-almacen";
import { RefObject, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useStoreProductoAgregadoCompra } from "~/app/_stores/store-producto-agregado-compra";
import { useProductosSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_hooks/useProductosSearch";
import type { Producto } from "~/app/_types/producto";
import { usePathname } from "next/navigation";
import { orangeColors, greenColors } from "~/lib/colors";

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
}: {
  value: string;
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getProductosResponseProps | undefined;
  }) => void;
  tipoBusqueda: TipoBusquedaProducto;
  ref?: RefObject<RefTableProductoSearchProps | null>;
  selectionColor?: string; // Agregar el prop
  isVisible?: boolean; // Prop para saber si el modal está visible
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

  const { data: response, refetch, loading } = useProductosSearch({
    filtros: {
      almacen_id,
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
    },
    enabled: false,
  });

  type ResponseItem = Producto;

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  );

  const productosCompra = useStoreProductoAgregadoCompra(
    (store) => store.productos
  );
  const setProductosCompra = useStoreProductoAgregadoCompra(
    (store) => store.setProductos
  );

  const productosFiltrados = useMemo(() => {
    return (response || []).filter(
      (producto) =>
        !productosCompra.find(
          (producto_compra) => producto_compra.producto_id === producto.id
        )
    );
  }, [response, productosCompra]);

  function handleRefetch() {
    setProductosCompra([]);
    refetch();
  }

  useEffect(() => {
    if (value) {
      handleRefetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, tipoBusqueda]);

  // Seleccionar automáticamente el primer producto cuando cambian los datos
  useEffect(() => {
    if (productosFiltrados && productosFiltrados.length > 0 && tableGridRef.current) {
      // Esperar a que AG Grid renderice los datos
      setTimeout(() => {
        const firstNode = tableGridRef.current.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setProductoSeleccionadoSearchStore(firstNode.data as any);
        }
      }, 100);
    } else {
      setProductoSeleccionadoSearchStore(undefined);
    }
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
      id="g-c-e-i.table-producto-search"
      onSelectionChanged={({ selectedNodes }) => {
        const producto = selectedNodes?.[0]?.data as Producto;
        setProductoSeleccionadoSearchStore(producto as any);
      }}
      onRowClicked={({ data, node }) => {
        // Con 1 click: seleccionar la fila (esto la pintará automáticamente)
        node.setSelected(true);
        setProductoSeleccionadoSearchStore(data as any);
      }}
      title="Productos"
      schema={ProductoCreateInputSchema}
      headersRequired={["Ubicación en Almacén"]}
      loading={loading}
      columnDefs={useColumnsProductos({ almacen_id }) as any}
      onRowDoubleClicked={({ data }) => {
        // Con 2 clicks: actualizar el producto Y ejecutar la acción adicional (abrir modal)
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
    />
  );
}
