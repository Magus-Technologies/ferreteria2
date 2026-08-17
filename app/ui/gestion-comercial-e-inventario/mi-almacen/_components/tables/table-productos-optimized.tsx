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
import { ProductoCreateInputSchema } from "~/types/zod-schemas";
import { z } from "zod";
import InputUploadMasivo from "../inputs/input-upload-masivo";
import { useStoreProductoSeleccionado } from "../../_store/store-producto-seleccionado";
import { useStoreFiltrosProductos } from "../../_store/store-filtros-productos";
import { useStoreQuickFilter } from "../../_store/store-quick-filter";
import { App } from "antd";
import { useProductosMiAlmacen } from "../../_hooks/useProductosMiAlmacen";
import ActionButtonsWrapper from "../others/action-buttons-wrapper";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Tabla de productos OPTIMIZADA para "Mi Almacén"
 *
 * Características:
 * - Carga TODOS los productos de una vez (single request)
 * - Filtros aplicados en memoria (client-side)
 * - Cache del backend (10 min) + React Query (5 min)
 * - Quick Filter local de AG Grid para búsquedas rápidas
 * - Loader visible durante carga
 */

// Columnas aceptadas por "Actualizar con Excel" (partial update). Cada header
// debe coincidir EXACTO con el nombre de columna del Excel.
const updateColumnasExtra: { headerName: string; field: string }[] = [
  { headerName: "Código de Producto", field: "cod_producto" },
  { headerName: "Código de Barra", field: "cod_barra" },
  { headerName: "Producto", field: "name" },
  { headerName: "Ticket", field: "name_ticket" },
  { headerName: "U. Contenidas", field: "unidades_contenidas" },
  { headerName: "Marca", field: "marca" },
  { headerName: "Categoria", field: "categoria" },
  { headerName: "Unidad de Medida", field: "unidad_medida" },
  { headerName: "Ubicación en Almacén", field: "ubicacion" },
  { headerName: "Stock Fracción en Almacén", field: "stock_fraccion" },
  { headerName: "Costo en Almacén", field: "costo" },
  { headerName: "S. Min", field: "stock_min" },
  { headerName: "S. Max", field: "stock_max" },
  { headerName: "Activo", field: "permitido" },
  { headerName: "Acción Técnica", field: "accion_tecnica" },
];

const updateProductoImportSchema = z.object({
  cod_producto: z.string().optional(),
  cod_barra: z.string().optional(),
  name: z.string().optional(),
  name_ticket: z.string().optional(),
  unidades_contenidas: z.number().optional(),
  marca: z.string().optional(),
  categoria: z.string().optional(),
  unidad_medida: z.string().optional(),
  ubicacion: z.string().optional(),
  stock_fraccion: z.number().optional(),
  costo: z.number().optional(),
  stock_min: z.number().optional(),
  stock_max: z.number().optional(),
  permitido: z.boolean().optional(),
  accion_tecnica: z.string().optional(),
});
function TableProductosOptimized() {
  const tableRef = useRef<AgGridReact>(null);
  const almacen_id = useStoreAlmacen((store) => store.almacen_id);
  const { notification } = App.useApp();
  const queryClient = useQueryClient();

  const setProductoSeleccionado = useStoreProductoSeleccionado(
    (store) => store.setProducto,
  );
  const productoSeleccionado = useStoreProductoSeleccionado(
    (store) => store.producto,
  );

  const filtros = useStoreFiltrosProductos((state) => state.filtros);
  const quickFilter = useStoreQuickFilter((state) => state.quickFilter);
  const { can } = usePermissionHook();
  const columns = useColumnsProductos({ almacen_id });

  // Hook optimizado: carga TODOS los productos de una vez
  const {
    data: productos,
    loading,
  } = useProductosMiAlmacen({
    almacenId: filtros?.almacen_id ?? null,
    filtros: { ...(filtros || {}) },
    enabled: !!filtros?.almacen_id,
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

  // Re-sincronizar el producto SELECCIONADO cuando llegan datos frescos (refetch por
  // websocket tras venta / ingreso / salida / recepción). Sin esto, las tablas
  // dependientes (Detalle de Precios, Últimas compras) muestran la foto vieja del
  // producto (stock/costo/buckets) hasta que el usuario lo re-selecciona.
  useEffect(() => {
    if (!productoSeleccionado?.id || !productos?.length) return;
    const fresh = productos.find((p) => p.id === productoSeleccionado.id);
    if (fresh && fresh !== productoSeleccionado) {
      setProductoSeleccionado(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos]);

  // Resetear cuando cambian los filtros
  useEffect(() => {
    hasSelectedFirstProduct.current = false;
  }, [filtros]);

  // Aplicar Quick Filter cuando cambia el texto de búsqueda
  useEffect(() => {
    if (tableRef.current?.api) {
      tableRef.current.api.setGridOption("quickFilterText", quickFilter || "");

      // Esperar un momento para que se aplique el filtro y luego seleccionar la primera fila visible
      setTimeout(() => {
        if (tableRef.current?.api) {
          const firstNode = tableRef.current.api.getDisplayedRowAtIndex(0);
          if (firstNode) {
            // Deseleccionar todas las filas primero
            tableRef.current.api.deselectAll();
            // Seleccionar la primera fila visible
            firstNode.setSelected(true);
            setProductoSeleccionado(firstNode.data);
            // Ocultar overlay si hay resultados
            tableRef.current.api.hideOverlay();
          } else {
            // Mostrar overlay cuando no hay resultados del filtro
            if (quickFilter) {
              tableRef.current.api.showNoRowsOverlay();
            } else {
              tableRef.current.api.hideOverlay();
            }
          }
        }
      }, 100);
    }
  }, [quickFilter, setProductoSeleccionado]);

  // Refetch cuando cambian filtros de almacén (se detecta por cambio de queryKey)
  // El filtrado real ocurre en memoria, no se vuelve a pegar al backend.

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
        // Solo spinner en la carga inicial. Los refetch en background (p.ej.
        // invalidación tras una venta) actualizan las filas in-place vía
        // getRowId sin bloquear la tabla con el overlay de loading.
        loading={loading}
        columnDefs={columns}
        rowData={productos}
        // CRÍTICO: getRowId permite que AG Grid mantenga el estado de filtros
        // cuando se agregan más datos (infinite scroll)
        getRowId={getRowId}
        cacheQuickFilter={true} // Habilita caché para mejor rendimiento de Quick Filter
        quickFilterText={quickFilter} // Aplicar Quick Filter directamente como prop
        extraTitle={
          can(permissions.PRODUCTO_IMPORT) && (
            <ActionButtonsWrapper label="Importar">
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
                    data.map((item) => item["Ubicación en Almacén"] as string).filter(Boolean), // Filtrar undefined/null
                  );

                  if (ubicacionesNames.size === 0) {
                    throw new Error(
                      "No se encontraron ubicaciones en el Excel. Asegúrate de que la columna 'Ubicación en Almacén' tenga valores.",
                    );
                  }

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
                      "No se pudieron crear/encontrar las ubicaciones. Puede ser un problema de permisos o el almacén no existe.",
                    );
                  }

                  const newData = data.map((item, index) => {
                    const {
                      "Stock Fracción en Almacén": stock_fraccion,
                      "Costo en Almacén": costo,
                      "Ubicación en Almacén": ubicacion,
                      ...rest
                    } = item;

                    if (!ubicacion) {
                      throw new Error(
                        `Fila ${index + 2}: Falta la columna 'Ubicación en Almacén'`,
                      );
                    }

                    const ubicacionStr = String(ubicacion).trim().toUpperCase();
                    const ubicacionEncontrada = ubicaciones.data!.find(
                      (u) => u.name.trim().toUpperCase() === ubicacionStr,
                    );

                    if (!ubicacionEncontrada) {
                      throw new Error(
                        `Fila ${index + 2}: No se encontró la ubicación "${ubicacion}". Disponibles: ${ubicaciones.data!.map(u => u.name).join(', ')}`,
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

                    // El backend procesa síncronamente y devuelve el resultado directo
                    const resultData = (res.data as any)?.data ?? res.data;

                    return {
                      data: {
                        imported: resultData?.imported ?? 0,
                        duplicates: resultData?.duplicates ?? 0,
                        errors: resultData?.errors ?? 0,
                        total: resultData?.total ?? 0,
                      },
                    };
                  },
                  msgSuccess: "Productos importados exitosamente",
                  onSuccess: async (res) => {
                    // Esperar a que la query traiga los productos recién importados ANTES
                    // de tocar selección o store, para no dejar a la UI sin producto
                    // (evita que tablas dependientes muestren "todos los productos" mientras recarga).
                    await queryClient.refetchQueries({
                      queryKey: ["productos-listado-completo"],
                    });

                    hasSelectedFirstProduct.current = false;

                    let attempts = 0;
                    const trySelectFirst = () => {
                      const api = tableRef.current?.api;
                      const firstNode = api?.getDisplayedRowAtIndex(0);
                      if (api && firstNode?.data) {
                        api.deselectAll();
                        firstNode.setSelected(true);
                        setProductoSeleccionado(firstNode.data);
                        hasSelectedFirstProduct.current = true;
                        return;
                      }
                      if (attempts++ < 20) setTimeout(trySelectFirst, 100);
                    };
                    setTimeout(trySelectFirst, 150);

                    const result = res.data as any;
                    if (result?.duplicates > 0) {
                      notification.info({
                        message: "Resultado de importación",
                        description: `Importados: ${result.imported}, Duplicados: ${result.duplicates}, Errores: ${result.errors}`,
                      });
                    }
                  },
                  queryKey: [
                    QueryKeys.PRODUCTOS,
                    QueryKeys.MARCAS,
                    QueryKeys.CATEGORIAS,
                    QueryKeys.UNIDADES_MEDIDA,
                  ],
                }}
              />
              <InputImport
                tableRef={tableRef}
                schema={updateProductoImportSchema}
                title="Actualizar con Excel"
                columnasExtra={updateColumnasExtra}
                preProcessData={async (data) => {
                  if (!almacen_id)
                    throw new Error("No se seleccionó un almacén");

                  return data.map((item, index) => {
                    const codProducto = String(
                      item["Código de Producto"] ?? "",
                    ).trim();
                    const codBarra = String(
                      item["Código de Barra"] ?? "",
                    ).trim();

                    if (!codProducto && !codBarra) {
                      throw new Error(
                        `Fila ${index + 2}: falta el 'Código de Producto'. Solo se actualizan productos existentes.`,
                      );
                    }

                    const row: Record<string, unknown> = {
                      ...item,
                      almacen_id,
                    };

                    if (codProducto) row["Código de Producto"] = codProducto;
                    if (codBarra) row["Código de Barra"] = codBarra;

                    // "Activo": solo se envía cuando el valor es explícito;
                    // celda vacía = no tocar el campo en el backend.
                    const activo = item["Activo"];
                    if (
                      activo !== undefined &&
                      activo !== null &&
                      String(activo).trim() !== ""
                    ) {
                      const v = String(activo).trim().toUpperCase();
                      row["Activo"] = ["ACTIVO", "SI", "TRUE", "1"].includes(
                        v,
                      )
                        ? true
                        : false;
                    } else {
                      delete row["Activo"];
                    }

                    return row;
                  });
                }}
                propsUseServerMutation={{
                  action: async (payload: {
                    data: Array<Record<string, unknown>>;
                  }) => {
                    const res = await productosApiV2.importUpdate({
                      data: payload.data.map((fila) => ({
                        ...fila,
                        almacen_id,
                      })),
                    });
                    if (res.error) {
                      throw new Error(res.error.message);
                    }

                    const resultData =
                      (res.data as any)?.data ?? res.data;

                    return {
                      data: {
                        total: resultData?.total ?? 0,
                        updated: resultData?.updated ?? 0,
                        not_found: resultData?.not_found ?? [],
                        not_found_count: resultData?.not_found_count ?? 0,
                        errors: resultData?.errors ?? [],
                        errors_count: resultData?.errors_count ?? 0,
                      },
                    };
                  },
                  msgSuccess: "Productos actualizados exitosamente",
                  onSuccess: async (res) => {
                    const result = res.data as any;
                    if (
                      result?.not_found_count > 0 ||
                      result?.errors_count > 0
                    ) {
                      notification.warning({
                        message: "Resultado de actualización",
                        description: (
                          <div className="max-h-[60dvh] overflow-y-auto">
                            <div className="mb-2">
                              Actualizados:{" "}
                              <strong className="text-green-600">
                                {result.updated}
                              </strong>
                            </div>
                            {result.not_found_count > 0 && (
                              <div className="mb-4">
                                <div className="font-bold text-orange-600">
                                  Códigos no encontrados (
                                  {result.not_found_count}):
                                </div>
                                <ul className="text-red-500 list-disc ml-4 max-h-40 overflow-y-auto">
                                  {result.not_found.map(
                                    (codigo: string, index: number) => (
                                      <li key={index}>{codigo}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                            {result.errors_count > 0 && (
                              <div>
                                <div className="font-bold text-red-600">
                                  Errores ({result.errors_count}):
                                </div>
                                <ul className="text-red-500 list-disc ml-4 max-h-40 overflow-y-auto">
                                  {result.errors.map(
                                    (error: string, index: number) => (
                                      <li key={index}>{error}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        ),
                      });
                    }

                    await queryClient.refetchQueries({
                      queryKey: ["productos-listado-completo"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: [QueryKeys.PRODUCTOS],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["productos-by-almacen"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["productos-infinite"],
                    });
                  },
                  queryKey: [QueryKeys.PRODUCTOS],
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
