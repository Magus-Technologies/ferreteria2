"use client";

import TableWithTitle from "~/components/tables/table-with-title";
import { useColumnsProductos } from "./columns-productos";
import type { Producto } from "~/app/_types/producto";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { productosApiV2 } from "~/lib/api/producto";
import { ubicacionesApi } from "~/lib/api/catalogos";
import { useStoreAlmacen } from "~/store/store-almacen";
import InputImport from "~/app/_components/form/inputs/input-import";
import { useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import usePermission from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import { ProductoCreateInputSchema } from "~/prisma/generated/zod";
import InputUploadMasivo from "../inputs/input-upload-masivo";
import { useStoreProductoSeleccionado } from "../../_store/store-producto-seleccionado";
import { useStoreFiltrosProductos } from "../../_store/store-filtros-productos";
import { App } from "antd";
import PaginationControls from "~/app/_components/tables/pagination-controls";
import { useProductosByAlmacen } from "../../_hooks/useProductosByAlmacen";
import ActionButtonsWrapper from "../others/action-buttons-wrapper";
import { useQueryClient } from "@tanstack/react-query";

function TableProductos() {
  const tableRef = useRef<AgGridReact>(null);
  const almacen_id = useStoreAlmacen((store) => store.almacen_id);
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const setProductoSeleccionado = useStoreProductoSeleccionado(
    (store) => store.setProducto
  );

  const filtros = useStoreFiltrosProductos((state) => state.filtros);

  const can = usePermission();

  const columns = useColumnsProductos({ almacen_id });

  const {
    data: response,
    loading,
    currentPage,
    totalPages,
    total,
    perPage: pageSize,
  } = useProductosByAlmacen({
    filtros: {
      ...filtros,
      almacen_id: filtros?.almacen_id || almacen_id || 1,
      page,
      per_page: 10000, // Cargar todos los productos (hasta 10,000)
    },
    enabled: !!(filtros?.almacen_id || almacen_id),
  });

  // Resetear página a 1 cuando cambien los filtros
  useEffect(() => {
    setPage(1);
  }, [filtros]);

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setPage((p) => Math.max(1, p - 1));

  return (
    <TableWithTitle<Producto>
      id="g-c-e-i.mi-almacen.productos"
      onSelectionChanged={({ selectedNodes }) =>
        setProductoSeleccionado(selectedNodes?.[0]?.data)
      }
      tableRef={tableRef}
      title="Productos"
      schema={ProductoCreateInputSchema}
      headersRequired={["Ubicación en Almacén"]}
      loading={loading}
      columnDefs={columns}
      rowData={response}
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
                if (!almacen_id) throw new Error("No se seleccionó un almacén");

                if (data.some((item) => !item["Ubicación en Almacén"]))
                  throw new Error(
                    "Todos los productos deben tener una ubicación obligatoriamente"
                  );

                const ubicacionesNames = new Set(
                  data.map((item) => item["Ubicación en Almacén"] as string)
                );

                console.log('📍 Ubicaciones a importar:', Array.from(ubicacionesNames));

                try {
                  const ubicaciones = await ubicacionesApi.importMany(
                    Array.from(ubicacionesNames).map((name) => ({
                      name,
                      almacen_id,
                    }))
                  );

                  console.log('✅ Respuesta de importarUbicaciones:', ubicaciones);

                  // Verificar si hay error en la respuesta
                  if ('error' in ubicaciones && ubicaciones.error) {
                    throw new Error(ubicaciones.error.message || "Error al importar ubicaciones");
                  }

                  if (!ubicaciones?.data || ubicaciones.data.length === 0) {
                    throw new Error("No se pudieron crear/encontrar las ubicaciones");
                  }

                  const newData = data.map((item) => {
                    const {
                      "Stock Fracción en Almacén": stock_fraccion,
                      "Costo en Almacén": costo,
                      "Ubicación en Almacén": ubicacion,
                      ...rest
                    } = item;
                    
                    const ubicacionEncontrada = ubicaciones.data!.find(
                      (u) => u.name === ubicacion
                    );

                    if (!ubicacionEncontrada) {
                      throw new Error(`No se encontró la ubicación: ${ubicacion}`);
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
                } catch (error) {
                  console.error('❌ Error en preProcessData:', error);
                  throw error;
                }
              }}
              propsUseServerMutation={{
                action: async (data: { data: Array<Record<string, unknown>> }) => {
                  const res = await productosApiV2.import(data);
                  if (res.error) {
                    throw new Error(res.error.message);
                  }
                  return { data: res.data };
                },
                msgSuccess: "Productos importados exitosamente",
                onSuccess: (res) => {
                  // Invalidar queries de productos por almacén para refrescar tabla
                  queryClient.invalidateQueries({
                    queryKey: ['productos-by-almacen']
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
                                  {String(item.name || '')}
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
    >
      {/* Paginación */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        loading={loading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </TableWithTitle>
  );
}

export default TableProductos;
