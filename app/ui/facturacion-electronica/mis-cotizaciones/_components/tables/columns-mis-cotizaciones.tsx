"use client";

import { ColDef } from "ag-grid-community";
import { formatFechaPeru } from "~/utils/fechas";
import { Cotizacion } from "~/lib/api/cotizaciones";
import CellAccionesCotizacion from "./cell-acciones-cotizacion";

// Cell Renderer para Stock Reservado
function CellStockReservado({ value }: { value: boolean }) {
  if (value) {
    return (
      <div className="flex items-center justify-center h-full font-semibold text-red-500 keep-text-color">
        RESERVADO
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center h-full">
      NORMAL
    </div>
  );
}

export function useColumnsMisCotizaciones(): ColDef<Cotizacion>[] {
  return [
    // {
    //   headerName: '#',
    //   valueGetter: 'node.rowIndex + 1',
    //   width: 50,
    //   pinned: 'left',
    // },
    {
      colId: "fecha",
      headerName: "Fecha",
      field: "fecha",
      width: 180,
      sort: "desc",
      valueFormatter: (params) =>
        formatFechaPeru(params.value, "DD/MM/YYYY hh:mm:ss A"),
    },
    {
      colId: "numero",
      headerName: "N°Prof",
      field: "numero",
      width: 150,
    },
    {
      colId: "modalidad",
      headerName: "Modalidad",
      valueGetter: () => "CONTADO",
      width: 120,
    },
    {
      colId: "stock",
      headerName: "Stock",
      field: "reservar_stock",
      width: 120,
      cellRenderer: CellStockReservado,
    },
    {
      colId: "cliente",
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
      colId: "direccion",
      headerName: "Dirección",
      valueGetter: (params) => params.data?.direccion || params.data?.cliente?.direccion || "",
      flex: 1,
      minWidth: 150,
    },
    {
      colId: "telefono",
      headerName: "Teléfono",
      valueGetter: (params) => params.data?.cliente?.telefono || "",
      width: 120,
    },
    {
      colId: "vendedor",
      headerName: "Vendedor",
      valueGetter: (params) => params.data?.user?.name || "",
      width: 150,
    },
    {
      colId: "registra",
      headerName: "Registra",
      valueGetter: (params) => params.data?.almacen?.name || "",
      width: 120,
    },
    {
      colId: "total",
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
      colId: "acciones",
      headerName: "Acciones",
      width: 250,
      pinned: "right",
      cellRenderer: CellAccionesCotizacion,
      cellRendererParams: (params: { data?: Cotizacion }) => ({
        cotizacionId: params.data?.id || "",
      }),
    },
  ];
}

