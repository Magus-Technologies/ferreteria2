"use client";

import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { Cotizacion } from "~/lib/api/cotizaciones";
import CellAccionesCotizacion from "./cell-acciones-cotizacion";

export function useColumnsMisCotizaciones(): ColDef<Cotizacion>[] {
  return [
    // {
    //   headerName: '#',
    //   valueGetter: 'node.rowIndex + 1',
    //   width: 50,
    //   pinned: 'left',
    // },
    {
      headerName: "Fecha",
      field: "fecha",
      width: 180,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      headerName: "N°Prof",
      field: "numero",
      width: 150,
    },
    {
      headerName: "Modalidad",
      valueGetter: () => "CONTADO",
      width: 120,
    },
    {
      headerName: "Cliente",
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        const cliente = params.data?.cliente;
        if (!cliente) return "";
        return (
          cliente.razon_social ||
          `${cliente.nombres} ${cliente.apellidos}`.trim()
        );
      },
    },
    {
      headerName: "Dirección",
      valueGetter: (params) => params.data?.cliente?.direccion || "",
      width: 150,
    },
    {
      headerName: "Teléfono",
      valueGetter: (params) => params.data?.cliente?.telefono || "",
      width: 120,
    },
    {
      headerName: "Vendedor",
      valueGetter: (params) => params.data?.user?.name || "",
      width: 150,
    },
    {
      headerName: "Registra",
      valueGetter: (params) => params.data?.almacen?.name || "",
      width: 120,
    },
    {
      headerName: "Total",
      width: 120,
      valueGetter: (params) => {
        const cotizacion = params.data;
        if (!cotizacion || !cotizacion.productos_por_almacen) return 0;

        const total = cotizacion.productos_por_almacen.reduce((sum, pa) => {
          const subtotalProducto = (pa.unidades_derivadas || []).reduce((subSum, ud) => {
            const cantidad = Number(ud.cantidad);
            const precio = Number(ud.precio);
            const recargo = Number(ud.recargo || 0);
            const descuento = Number(ud.descuento || 0);
            
            // Calcular total de la línea (igual que en ventas)
            const subtotalLinea = precio * cantidad; // SIN multiplicar por factor
            const subtotalConRecargo = subtotalLinea + recargo;
            
            // Aplicar descuento
            let montoLinea = subtotalConRecargo;
            if (ud.descuento_tipo === '%') {
              montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100);
            } else {
              montoLinea = subtotalConRecargo - descuento;
            }
            
            return subSum + montoLinea;
          }, 0);
          return sum + subtotalProducto;
        }, 0);

        return total;
      },
      valueFormatter: (params) => `S/. ${params.value?.toFixed(2) || "0.00"}`,
      cellStyle: { fontWeight: "bold", color: "#059669" },
    },
    {
      headerName: "Acciones",
      width: 150,
      pinned: "right",
      cellRenderer: CellAccionesCotizacion,
      cellRendererParams: (params: { data?: Cotizacion }) => ({
        cotizacionId: params.data?.id || "",
      }),
    },
  ];
}

