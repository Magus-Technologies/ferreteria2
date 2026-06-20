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

// Calcula el total de la cotización (precios ya incluyen IGV).
function calcularTotalCotizacion(cotizacion: Cotizacion): number {
  const productos = cotizacion.productos_por_almacen;
  if (!productos) return 0;

  return productos.reduce((sum, pa) => {
    const subtotalProducto = (pa.unidades_derivadas || []).reduce((subSum, ud) => {
      const cantidad = Number(ud.cantidad);
      const precio = Number(ud.precio);
      const recargo = Number(ud.recargo || 0);
      const descuento = Number(ud.descuento || 0);

      const subtotalLinea = precio * cantidad; // SIN multiplicar por factor
      const subtotalConRecargo = subtotalLinea + recargo;

      let montoLinea = subtotalConRecargo;
      if (ud.descuento_tipo === "%") {
        montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento) / 100;
      } else {
        montoLinea = subtotalConRecargo - descuento;
      }

      return subSum + montoLinea;
    }, 0);
    return sum + subtotalProducto;
  }, 0);
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
      colId: "igv",
      headerName: "IGV",
      width: 110,
      valueGetter: (params) => {
        const cotizacion = params.data;
        if (!cotizacion) return 0;

        // El IGV solo aplica cuando el documento del cliente es RUC (11 dígitos).
        const documento =
          cotizacion.cliente?.numero_documento || cotizacion.ruc_dni || "";
        if (documento.trim().length !== 11) return 0;

        // El total ya incluye IGV (18%); se desglosa la parte del impuesto.
        const total = calcularTotalCotizacion(cotizacion);
        return total - total / 1.18;
      },
      valueFormatter: (params) =>
        params.value ? `S/. ${params.value.toFixed(2)}` : "—",
      cellStyle: { color: "#0891b2" },
    },
    {
      colId: "total",
      headerName: "Total",
      width: 120,
      valueGetter: (params) => {
        const cotizacion = params.data;
        if (!cotizacion) return 0;
        return calcularTotalCotizacion(cotizacion);
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

