"use client";

import TableWithTitle from "~/components/tables/table-with-title";
import { useColumnsProductos } from "./columns-productos";
import type { Producto } from "~/app/_types/producto";
import { greenColors } from "~/lib/colors";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { productosApiV2 } from "~/lib/api/producto";
import { ubicacionesApi } from "~/lib/api/catalogos";
import { useStoreAlmacen } from "~/store/store-almacen";
import InputImport from "~/app/_components/form/inputs/input-import";
import { useRef, useEffect, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { GetRowIdParams } from "ag-grid-community";
import usePermissionHook from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import { ProductoCreateInputSchema } from "~/prisma/generated/zod";
import InputUploadMasivo from "../inputs/input-upload-masivo";
import { useStoreProductoSeleccionado } from "../../_store/store-producto-seleccionado";
import { useStoreFiltrosProductos } from "../../_store/store-filtros-productos";
import { App } from "antd";
import { useProductosInfiniteScroll } from "../../_hooks/useProductosInfiniteScroll";
import ActionButtonsWrapper from "../others/action-buttons-wrapper";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Tabla de productos OPTIMIZADA con Infinite Scroll
 *
 * Características:
 * - Carga inicial de 200 productos (rápido)
 * - Carga automática de más productos al hacer scroll
 * - Sin paginación visible (scroll infinito)
 * - Cache inteligente para filtros rápidos
 * - Loader visible durante carga
 */
function TableProductosOptimized() {
  const tableRef = useRef<AgGridReact>(null);
  const almacen_id = useStoreAlmacen((store) => store.almacen_id);
  const { notification } = App.useApp();
  const queryClient = useQueryClient();

  const setProductoSeleccionado = useStoreProductoSeleccionado(
    (store) => store.setProducto,
  );

  const filtros = useStoreFiltrosProductos((state) => state.filtros);
  const { can } = usePermissionHook();
  const columns = useColumnsProductos({ almacen_id });

  // Hook optimizado con infinite scroll
  const {
    data: productos,
    loading,
    loadingMore,
    total,
    loaded,
    hasMore,
    fetchNextPage,
  } = useProductosInfiniteScroll({
    filtros: {
      ...filtros,
      almacen_id: filtros?.almacen_id || almacen_id || 1,
    },
    enabled: !!(filtros?.almacen_id || almacen_id),
    perPage: 1000, // 1000 productos por página (cacheable, no causa error)
  });

  // IMPORTANTE: getRowId permite que AG Grid identifique filas únicas
  // Esto evita que los filtros se reseteen cuando se agregan más datos
  const getRowId = useCallback((params: GetRowIdParams<Producto>) => {
    return String(params.data.id);
  }, []);

  // Referencia para saber si ya seleccionamos el primer producto
  const hasSelectedFirstProduct = useRef(false);

  // Seleccionar automáticamente el primer producto SOLO la primera vez
  useEffect(() => {
    if (
      productos &&
      productos.length > 0 &&
      tableRef.current &&
      !hasSelectedFirstProduct.current
    ) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setProductoSeleccionado(firstNode.data);
          hasSelectedFirstProduct.current = true;
        }
      }, 100);
    }
  }, [productos, setProductoSeleccionado]);

  // Resetear cuando cambian los filtros
  useEffect(() => {
    hasSelectedFirstProduct.current = false;
  }, [filtros]);

  // Mostrar información de carga en consola
  useEffect(() => {
    if (loaded > 0) {
      console.log(
        `📊 Productos cargados: ${loaded}/${total} (${Math.round((loaded / total) * 100)}%)`,
      );
    }
  }, [loaded, total]);

  // Cargar automáticamente todas las páginas en segundo plano
  useEffect(() => {
    if (!loading && hasMore && !loadingMore) {
      // Esperar 500ms antes de cargar la siguiente página
      const timer = setTimeout(() => {
        console.log("🔄 Cargando siguiente página automáticamente...");
        fetchNextPage();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, hasMore, loadingMore, fetchNextPage]);

  return (
    <div className="flex flex-col h-full">
      <TableWithTitle<Producto>
        id="g-c-e-i.mi-almacen.productos"
        selectionColor={greenColors[10]}
        onSelectionChanged={({ selectedNodes }) =>
          setProductoSeleccionado(selectedNodes?.[0]?.data)
        }
        onRowClicked={(event) => {
          event.node.setSelected(true);
        }}
        tableRef={tableRef}
        title="Productos"
        schema={ProductoCreateInputSchema}
        headersRequired={["Ubicación en Almacén"]}
        loading={loading}
        columnDefs={columns}
        rowData={productos}
        // CRÍTICO: getRowId permite que AG Grid mantenga el estado de filtros
        // cuando se agregan más datos (infinite scroll)
        getRowId={getRowId}
        extraTitle={
          can(permissions.PRODUCTO_IMPORT) && (
            <ActionButtonsWrapper>
              <InputImport
                tableRef={tableRef}
                schema={ProductoCreateInputSchema}
                columnasExtra={[
                  {
                    headerName: "producto_en_almacenes",
                    field: "producto_en_almacenes",
                  },
                ]}
                preProcessData={async (data) => {
                  if (!almacen_id)
                    throw new Error("No se seleccionó un almacén");

                  if (data.some((item) => !item["Ubicación en Almacén"]))
                    throw new Error(
                      "Todos los productos deben tener una ubicación obligatoriamente",
                    );

                  const ubicacionesNames = new Set(
                    data.map((item) => item["Ubicación en Almacén"] as string),
                  );

                  const ubicaciones = await ubicacionesApi.importMany(
                    Array.from(ubicacionesNames).map((name) => ({
                      name,
                      almacen_id,
                    })),
                  );

                  if ("error" in ubicaciones && ubicaciones.error) {
                    throw new Error(
                      ubicaciones.error.message ||
                        "Error al importar ubicaciones",
                    );
                  }

                  if (!ubicaciones?.data || ubicaciones.data.length === 0) {
                    throw new Error(
                      "No se pudieron crear/encontrar las ubicaciones",
                    );
                  }

                  const newData = data.map((item) => {
                    const {
                      "Stock Fracción en Almacén": stock_fraccion,
                      "Costo en Almacén": costo,
                      "Ubicación en Almacén": ubicacion,
                      ...rest
                    } = item;

                    const ubicacionEncontrada = ubicaciones.data!.find(
                      (u) => u.name === ubicacion,
                    );

                    if (!ubicacionEncontrada) {
                      throw new Error(
                        `No se encontró la ubicación: ${ubicacion}`,
                      );
                    }

                    return {
                      ...rest,
                      producto_en_almacenes: {
                        create: {
                          stock_fraccion,
                          costo,
                          ubicacion_id: ubicacionEncontrada.id,
                          almacen_id,
                        },
                      },
                    };
                  });

                  return newData;
                }}
                propsUseServerMutation={{
                  action: async (data: {
                    data: Array<Record<string, unknown>>;
                  }) => {
                    const res = await productosApiV2.import(data);
                    if (res.error) {
                      throw new Error(res.error.message);
                    }
                    return { data: res.data };
                  },
                  msgSuccess: "Productos importados exitosamente",
                  onSuccess: (res) => {
                    queryClient.invalidateQueries({
                      queryKey: ["productos-infinite"],
                    });

                    if (res.data?.length)
                      notification.info({
                        message: "Productos duplicados",
                        description: (
                          <div className="max-h-[60dvh] overflow-y-auto">
                            <p>
                              Los siguientes productos no se subieron porque ya
                              existen:
                            </p>
                            {res.data.map((item, index) => (
                              <div key={index} className="pr-4">
                                <div className="grid grid-cols-3 gap-x-4 pl-8">
                                  <span className="text-red-500 text-nowrap">
                                    {String(item.name || "")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ),
                      });
                  },
                  queryKey: [
                    QueryKeys.PRODUCTOS,
                    QueryKeys.MARCAS,
                    QueryKeys.CATEGORIAS,
                    QueryKeys.UNIDADES_MEDIDA,
                  ],
                }}
              />
              <InputUploadMasivo
                accept="image/*"
                buttonProps={{ color: "warning" }}
                tipo="img"
                buttonTitle="Subir Imágenes"
              />
              <InputUploadMasivo
                accept="application/pdf"
                buttonProps={{ color: "danger" }}
                tipo="ficha_tecnica"
                buttonTitle="Subir Fichas Técnicas"
              />
            </ActionButtonsWrapper>
          )
        }
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
          ...(can(permissions.PRODUCTO_IMPORT)
            ? [
                {
                  color: "warning" as const,
                  label: "Importación",
                  columns: [
                    "Código de Producto",
                    "Código de Barra",
                    "Producto",
                    "Ticket",
                    "U. Contenidas",
                    "Marca",
                    "Categoria",
                    "Unidad de Medida",
                    "Ubicación en Almacén",
                    "Stock Fracción en Almacén",
                    "Costo en Almacén",
                    "S. Min",
                    "S. Max",
                    "Activo",
                    "Acción Técnica",
                    "Ruta IMG",
                    "Ruta Ficha Técnica",
                  ],
                },
              ]
            : []),
        ]}
      />

      {/* Barra de estado fija en la parte inferior - Solo muestra loading */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-1.5 min-h-[32px]">
        {loading && (
          <div className="text-xs text-gray-500 text-center">
            ⏳ Cargando productos...
          </div>
        )}
      </div>
    </div>
  );
}

export default TableProductosOptimized;
