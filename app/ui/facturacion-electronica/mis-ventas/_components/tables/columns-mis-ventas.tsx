"use client";

import { ColDef } from "ag-grid-community";
import { getVentaResponseProps } from "~/app/_actions/venta";
import dayjs from "dayjs";
import CellAccionesVenta from "./cell-acciones-venta";

export function useColumnsMisVentas() {
  const columnDefs: ColDef<getVentaResponseProps>[] = [
    // Columna # comentada porque ya viene automáticamente en la tabla
    // {
    //   headerName: '#',
    //   valueGetter: 'node.rowIndex + 1',
    //   width: 60,
    //   pinned: 'left',
    // },
    {
      headerName: "T.Doc",
      field: "tipo_documento",
      width: 100,
    },
    {
      headerName: "F.Venta",
      field: "fecha",
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      headerName: "S.Numero",
      colId: "serie_numero",
      field: "serie",
      width: 150,
      valueGetter: (params) => {
        const serie = params.data?.serie || "";
        const numero = params.data?.numero || "";
        return serie && numero ? `${serie}-${numero}` : "";
      },
    },
    {
      headerName: "Cliente",
      colId: "cliente_nombre",
      field: "cliente.razon_social",
      width: 300,
      valueGetter: (params) => {
        const cliente = params.data?.cliente;
        if (!cliente) return "CLIENTES VARIOS";
        return (
          cliente.razon_social || `${cliente.nombres} ${cliente.apellidos}`
        );
      },
    },
    {
      headerName: "Subtotal",
      colId: "subtotal",
      field: "productos_por_almacen",
      width: 120,
      valueGetter: (params) => {
        const productos = params.data?.productos_por_almacen || [];
        const subtotal = productos.reduce((sum, producto) => {
          const productoTotal = producto.unidades_derivadas.reduce(
            (pSum, unidad) => {
              return (
                pSum +
                Number(unidad.cantidad) *
                  Number(unidad.factor) *
                  Number(unidad.precio)
              );
            },
            0
          );
          return sum + productoTotal;
        }, 0);
        return subtotal;
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: "IGV",
      colId: "igv",
      field: "productos_por_almacen",
      width: 100,
      valueGetter: (params) => {
        const productos = params.data?.productos_por_almacen || [];
        const subtotal = productos.reduce((sum, producto) => {
          const productoTotal = producto.unidades_derivadas.reduce(
            (pSum, unidad) => {
              return (
                pSum +
                Number(unidad.cantidad) *
                  Number(unidad.factor) *
                  Number(unidad.precio)
              );
            },
            0
          );
          return sum + productoTotal;
        }, 0);
        return subtotal * 0.18;
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: "Total",
      colId: "total",
      field: "productos_por_almacen",
      width: 120,
      valueGetter: (params) => {
        const productos = params.data?.productos_por_almacen || [];
        const subtotal = productos.reduce((sum, producto) => {
          const productoTotal = producto.unidades_derivadas.reduce(
            (pSum, unidad) => {
              return (
                pSum +
                Number(unidad.cantidad) *
                  Number(unidad.factor) *
                  Number(unidad.precio)
              );
            },
            0
          );
          return sum + productoTotal;
        }, 0);
        return subtotal * 1.18;
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: "F.Pago",
      field: "forma_de_pago",
      width: 100,
    },
    {
      headerName: "Estado",
      field: "estado_de_venta",
      width: 100,
    },
    {
      headerName: "Usuario",
      colId: "usuario_nombre",
      field: "user.name",
      width: 150,
      valueGetter: (params) => params.data?.user?.name || "",
    },
    {
      headerName: "Acciones",
      field: "id",
      width: 100,
      pinned: "right",
      cellRenderer: CellAccionesVenta,
      cellRendererParams: (params: { data?: getVentaResponseProps }) => ({
        ventaId: params.data?.id || "",
      }),
    },
  ];

  return columnDefs;
}
