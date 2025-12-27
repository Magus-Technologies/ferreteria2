"use client";

import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { FaPrint } from "react-icons/fa";
import { Prestamo, TipoOperacion, EstadoPrestamo } from "~/lib/api/prestamo";

export function useColumnsMisPrestamos(): ColDef<Prestamo>[] {
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
      headerName: "N° Préstamo",
      field: "numero",
      width: 150,
    },
    {
      headerName: "F. Vencimiento",
      field: "fecha_vencimiento",
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      headerName: "Operación",
      field: "tipo_operacion",
      width: 140,
      cellStyle: (params) => ({
        color: params.value === TipoOperacion.PRESTAR ? '#059669' : '#dc2626',
        fontWeight: 'bold'
      }),
      valueFormatter: (params) => {
        if (params.value === TipoOperacion.PRESTAR) return 'PRESTAR';
        if (params.value === TipoOperacion.PEDIR_PRESTADO) return 'PEDIR PRESTADO';
        return params.value;
      }
    },
    {
      headerName: "Cliente/Proveedor",
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        const data = params.data;
        if (!data) return "";

        if (data.cliente) {
          return data.cliente.razon_social ||
            `${data.cliente.nombres || ''} ${data.cliente.apellidos || ''}`.trim();
        }

        if (data.proveedor) {
          return data.proveedor.razon_social;
        }

        return "";
      },
    },
    {
      headerName: "Dirección",
      width: 150,
      valueGetter: (params) => {
        const data = params.data;
        return data?.cliente?.direccion || data?.proveedor?.direccion || data?.direccion || "";
      },
    },
    {
      headerName: "Teléfono",
      width: 120,
      valueGetter: (params) => {
        const data = params.data;
        return data?.cliente?.telefono || data?.proveedor?.telefono || data?.telefono || "";
      },
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
      headerName: "Monto Total",
      field: "monto_total",
      width: 120,
      valueFormatter: (params) => {
        const moneda = params.data?.tipo_moneda === 'd' ? '$' : 'S/.';
        const value = Number(params.value);
        return `${moneda} ${isNaN(value) ? "0.00" : value.toFixed(2)}`;
      },
      cellStyle: { fontWeight: "bold", color: "#1e40af" },
    },
    {
      headerName: "Pagado",
      field: "monto_pagado",
      width: 110,
      valueFormatter: (params) => {
        const moneda = params.data?.tipo_moneda === 'd' ? '$' : 'S/.';
        const value = Number(params.value);
        return `${moneda} ${isNaN(value) ? "0.00" : value.toFixed(2)}`;
      },
      cellStyle: { fontWeight: "bold", color: "#059669" },
    },
    {
      headerName: "Pendiente",
      field: "monto_pendiente",
      width: 110,
      valueFormatter: (params) => {
        const moneda = params.data?.tipo_moneda === 'd' ? '$' : 'S/.';
        const value = Number(params.value);
        return `${moneda} ${isNaN(value) ? "0.00" : value.toFixed(2)}`;
      },
      cellStyle: { fontWeight: "bold", color: "#dc2626" },
    },
    {
      headerName: "Estado",
      field: "estado_prestamo",
      width: 130,
      cellStyle: (params) => {
        const estado = params.value;
        let color = '#6b7280';
        if (estado === EstadoPrestamo.PAGADO_TOTAL) color = '#059669';
        if (estado === EstadoPrestamo.PAGADO_PARCIAL) color = '#ea580c';
        if (estado === EstadoPrestamo.VENCIDO) color = '#dc2626';
        return { color, fontWeight: 'bold' };
      },
      valueFormatter: (params) => {
        const estado = params.value;
        if (estado === EstadoPrestamo.PENDIENTE) return 'PENDIENTE';
        if (estado === EstadoPrestamo.PAGADO_PARCIAL) return 'PAGADO PARCIAL';
        if (estado === EstadoPrestamo.PAGADO_TOTAL) return 'PAGADO TOTAL';
        if (estado === EstadoPrestamo.VENCIDO) return 'VENCIDO';
        return estado;
      }
    },
    {
      headerName: "Acciones",
      width: 120,
      pinned: "right",
      cellRenderer: (params: { data: Prestamo }) => {
        return (
          <div className="flex items-center gap-2 h-full">
            <button
              onClick={() => {
                window.open(`/api/pdf/prestamo/${params.data.id}`, '_blank');
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
