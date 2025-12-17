"use client";

import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { FaFileInvoice, FaPrint } from "react-icons/fa";
import { GetCotizacionesResponse } from "~/app/_actions/cotizacion";

type Cotizacion = GetCotizacionesResponse;

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
        if (!cotizacion) return 0;

        const total = cotizacion.productos_por_almacen.reduce((sum, pa) => {
          const subtotalProducto = pa.unidades_derivadas.reduce((subSum, ud) => {
            return subSum + (Number(ud.cantidad) * Number(ud.factor) * Number(ud.precio));
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
      cellRenderer: (params: { data: Cotizacion }) => {
        return (
          <div className="flex items-center gap-2 h-full">
            <button
              onClick={() => {
                // Convertir a venta
                console.log("Convertir a venta:", params.data);
              }}
              className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded transition-colors"
              title="Convertir a Venta"
            >
              <FaFileInvoice />
            </button>
            <button
              onClick={() => {
                window.open(`/api/pdf/cotizacion/${params.data.id}`, '_blank')
              }}
              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
              title="Imprimir PDF"
            >
              <FaPrint />
            </button>
          </div>
        );
      },
    },
  ];
}
