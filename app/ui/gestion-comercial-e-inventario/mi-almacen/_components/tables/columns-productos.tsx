"use client";

import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { Popover, Tooltip } from "antd";
import { FaImage } from "react-icons/fa";
import { IoIosCopy } from "react-icons/io";
import { PiWarehouseFill } from "react-icons/pi";
import { GoAlertFill } from "react-icons/go";
import ColumnAction from "~/components/tables/column-action";
import usePermissionHook from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import ProductoOtrosAlmacenes from "../others/producto-otros-almacenes";
import { SiAdblock } from "react-icons/si";
import { getStock, GetStock } from "~/app/_utils/get-stock";
import type { Producto } from "~/app/_types/producto";
import { getStorageUrl } from "~/utils/upload";
import {
  productoEditOrCopy,
  useStoreEditOrCopyProducto,
} from "../../_store/store-edit-or-copy-producto";
import { productosApiV2 } from "~/lib/api/producto";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useMemo } from "react";

interface UseColumnsProductosProps {
  almacen_id?: number;
}

export function useColumnsProductos({ almacen_id }: UseColumnsProductosProps) {
  const { can } = usePermissionHook();
  const setOpen = useStoreEditOrCopyProducto((state) => state.setOpenModal);
  const setProducto = useStoreEditOrCopyProducto((state) => state.setProducto);

  const columns: ColDef<Producto>[] = useMemo(
    () => [
      {
        headerName: "Código de Producto",
        colId: "cod_producto",
        field: "cod_producto",
        width: 80,
        filter: true,
      },
      {
        headerName: "Producto",
        colId: "name",
        field: "name",
        width: 350,
        minWidth: 350,
        filter: true,
        cellRenderer: ({ value, data }: ICellRendererParams<Producto>) => {
          return (
            <div className="flex items-center gap-2 pr-5">
              {!data?.permitido && (
                <Tooltip
                  classNames={{ body: "text-center!" }}
                  title="Este producto aún no tiene Unidades Derivadas Importadas, no podrá usarse para venta, compra, o alguna otra acción"
                >
                  <GoAlertFill className="text-rose-700 cursor-pointer" />
                </Tooltip>
              )}
              <Tooltip classNames={{ body: "text-center!" }} title={value}>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {value}
                </div>
              </Tooltip>
              <Popover
                content={
                  data?.img ? (
                    <img
                      src={getStorageUrl(data.img) || ""}
                      alt="Imagen del producto"
                      className="max-w-72 max-h-72"
                    />
                  ) : (
                    "No hay Imagen"
                  )
                }
              >
                <FaImage
                  size={15}
                  className={`cursor-pointer min-w-fit absolute right-0 ${
                    data?.img ? "text-cyan-600" : "text-gray-400"
                  }`}
                />
              </Popover>
            </div>
          );
        },
        flex: 1,
      },
      {
        headerName: "Ticket",
        colId: "name_ticket",
        field: "name_ticket",
        width: 350,
        minWidth: 350,
        filter: true,
        flex: 1,
      },
      {
        headerName: "Ubicación en Almacén",
        colId: "ubicacion_almacen",
        field: "producto_en_almacenes",
        width: 80,
        filter: true,
        valueFormatter: ({
          value,
        }: ValueFormatterParams<
          Producto,
          Producto["producto_en_almacenes"]
        >) => {
          const producto_en_almacen = value?.find(
            (item) => item.almacen_id === almacen_id,
          );
          return producto_en_almacen?.ubicacion?.name ?? "";
        },
      },
      {
        headerName: "Stock Fracción en Almacén",
        colId: "stock_fraccion_almacen",
        field: "producto_en_almacenes",
        width: 70,
        filter: true,
        valueFormatter: ({
          value,
        }: ValueFormatterParams<
          Producto,
          Producto["producto_en_almacenes"]
        >) => {
          const producto_en_almacen = value?.find(
            (item) => item.almacen_id === almacen_id,
          );
          return `${Number(producto_en_almacen?.stock_fraccion ?? 0)}`;
        },
      },
      {
        headerName: "Costo en Almacén",
        colId: "costo_almacen",
        field: "producto_en_almacenes",
        width: 80,
        filter: true,
        valueFormatter: ({
          value,
          data,
        }: ValueFormatterParams<
          Producto,
          Producto["producto_en_almacenes"]
        >) => {
          const producto_en_almacen = value?.find(
            (item) => item.almacen_id === almacen_id,
          );
          return `${
            Number(producto_en_almacen?.costo ?? 0) *
            Number(data!.unidades_contenidas)
          }`;
        },
        type: "pen4",
      },
      {
        headerName: "U. Contenidas",
        colId: "unidades_contenidas",
        field: "unidades_contenidas",
        width: 50,
        filter: true,
      },
      {
        headerName: "Código de Barra",
        colId: "cod_barra",
        field: "cod_barra",
        width: 120,
        filter: true,
      },
      {
        headerName: "Marca",
        colId: "marca",
        field: "marca.name",
        width: 140,
        filter: true,
      },
      {
        headerName: "Categoria",
        colId: "categoria",
        field: "categoria.name",
        width: 140,
        filter: true,
      },
      {
        headerName: "Unidad de Medida",
        colId: "unidad_medida",
        field: "unidad_medida.name",
        width: 100,
        filter: true,
      },
      {
        headerName: "Stock",
        colId: "stock",
        field: "producto_en_almacenes",
        width: 90,
        filter: true,
        valueFormatter: ({
          value,
          data,
        }: ValueFormatterParams<
          Producto,
          Producto["producto_en_almacenes"]
        >) => {
          const producto_en_almacen = value?.find(
            (item) => item.almacen_id === almacen_id,
          );
          return getStock({
            stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
            unidades_contenidas: Number(data!.unidades_contenidas),
          }).stock;
        },
        cellRenderer: ({
          value,
          data,
        }: ICellRendererParams<
          Producto,
          Producto["producto_en_almacenes"]
        >) => {
          const producto_en_almacen = value?.find(
            (item) => item.almacen_id === almacen_id,
          );
          return (
            <div className="flex items-center justify-between gap-2">
              <div>
                <GetStock
                  stock_fraccion={Number(
                    producto_en_almacen?.stock_fraccion ?? 0,
                  )}
                  unidades_contenidas={Number(data!.unidades_contenidas)}
                />
              </div>
              <Popover
                placement="right"
                trigger="click"
                content={
                  <div className="flex flex-col items-center justify-center gap-6 px-4 py-2">
                    {value && value.length > 0 ? (
                      value.map((item, index) => {
                        // Validar que existan unidades derivadas
                        if (
                          !item?.unidades_derivadas ||
                          item.unidades_derivadas.length === 0
                        ) {
                          return null;
                        }

                        const unidadDerivada =
                          item.unidades_derivadas.find(
                            (ud) =>
                              Number(ud.factor) ===
                              Number(data!.unidades_contenidas),
                          ) ?? item.unidades_derivadas[0];

                        // Validar que la unidad derivada tenga la propiedad unidad_derivada
                        if (!unidadDerivada?.unidad_derivada) {
                          return null;
                        }

                        return (
                          <ProductoOtrosAlmacenes
                            key={index}
                            stock_fraccion={Number(item.stock_fraccion)}
                            unidades_contenidas={Number(
                              data!.unidades_contenidas,
                            )}
                            producto_almacen_unidad_derivada={{
                              ...unidadDerivada,
                              unidad_derivada: {
                                ...unidadDerivada.unidad_derivada,
                                estado: true,
                              },
                            }}
                            almacen={item.almacen?.name}
                          />
                        );
                      })
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Sin datos de almacén
                      </div>
                    )}
                  </div>
                }
              >
                <PiWarehouseFill
                  size={15}
                  className="text-cyan-600 cursor-pointer min-w-fit"
                />
              </Popover>
            </div>
          );
        },
      },
      {
        headerName: "S. Min",
        colId: "stock_min",
        field: "stock_min",
        width: 50,
        filter: true,
      },
      {
        headerName: "S. Max",
        colId: "stock_max",
        field: "stock_max",
        width: 50,
        filter: true,
      },
      {
        headerName: "Activo",
        colId: "estado",
        field: "estado",
        width: 90,
        type: "boolean",
      },
      {
        headerName: "Acción Técnica",
        colId: "accion_tecnica",
        field: "accion_tecnica",
        width: 250,
        filter: true,
      },
      {
        headerName: "Ruta IMG",
        colId: "img",
        field: "img",
        width: 250,
        filter: true,
        type: "link",
        valueFormatter: ({ value }: ValueFormatterParams<Producto, string>) => {
          return getStorageUrl(value) || "";
        },
      },
      {
        headerName: "Ruta Ficha Técnica",
        colId: "ficha_tecnica",
        field: "ficha_tecnica",
        width: 250,
        filter: true,
        type: "link",
        valueFormatter: ({ value }: ValueFormatterParams<Producto, string>) => {
          return getStorageUrl(value) || "";
        },
      },
      {
        headerName: "Acciones",
        colId: "acciones",
        field: "id",
        width: 80,
        cellRenderer: (params: ICellRendererParams<Producto>) => {
          const tieneIngresos = params.data?.tiene_ingresos ?? false;

          return params.data?.permitido ? (
            <ColumnAction
              id={params.value}
              permiso={permissions.PRODUCTO_BASE}
              propsDelete={{
                action: async ({ id }: { id: number }) => {
                  const res = await productosApiV2.delete(id);
                  if (res.error) {
                    throw new Error(res.error.message);
                  }
                  return { data: res.data };
                },
                msgSuccess: "Producto eliminado correctamente",
                queryKey: [QueryKeys.PRODUCTOS_BY_ALMACEN],
                disabled: tieneIngresos,
                disabledTooltip: tieneIngresos
                  ? "No se puede eliminar porque el producto tiene movimientos (ingresos/salidas, ventas o compras)"
                  : undefined,
              }}
              onEdit={() => {
                setProducto(params.data as unknown as productoEditOrCopy);
                setOpen(true);
              }}
              childrenMiddle={
                can(permissions.PRODUCTO_DUPLICAR) && (
                  <Tooltip title="Duplicar">
                    <IoIosCopy
                      onClick={() => {
                        setProducto({
                          ...params.data!,
                          id: undefined,
                          cod_producto: undefined,
                          cod_barra: undefined,
                        } as unknown as productoEditOrCopy);
                        setOpen(true);
                      }}
                      size={15}
                      className="cursor-pointer text-cyan-600 hover:scale-105 transition-all active:scale-95"
                    />
                  </Tooltip>
                )
              }
            />
          ) : (
            <div className="flex items-center gap-2 h-full">
              <Tooltip
                classNames={{ body: "text-center!" }}
                title="Falta Importar sus Unidades Derivadas"
              >
                <SiAdblock
                  size={15}
                  className="text-rose-700 cursor-pointer min-w-fit"
                />
              </Tooltip>
            </div>
          );
        },
        type: "actions",
      },
    ],
    [almacen_id, can, setOpen, setProducto],
  );

  return columns;
}
