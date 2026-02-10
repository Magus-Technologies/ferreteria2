"use client";

import { useRef } from "react";
import { ColDef } from "ag-grid-community";
import TableWithTitle from "~/components/tables/table-with-title";
import type { DetalleComprobanteElectronico } from "~/lib/api/facturacion-electronica";

interface TableDetalleComprobanteProps {
  detalles: DetalleComprobanteElectronico[];
  loading?: boolean;
}

export default function TableDetalleComprobante({
  detalles,
  loading = false,
}: TableDetalleComprobanteProps) {
  const tableGridRef = useRef<any>(null);

  const columnDefs: ColDef<DetalleComprobanteElectronico>[] = [
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 60,
      cellStyle: { textAlign: "center", fontWeight: "500" },
    },
    {
      headerName: "Código",
      field: "codigo_producto",
      width: 120,
      cellStyle: { fontWeight: "600" },
    },
    {
      headerName: "Descripción del producto",
      field: "descripcion",
      flex: 1,
      minWidth: 300,
    },
    {
      headerName: "U. Medida",
      field: "unidad_medida",
      width: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "Cantidad",
      field: "cantidad",
      width: 100,
      cellStyle: { textAlign: "right", fontWeight: "bold" },
      valueFormatter: (params) => params.value?.toFixed(2) || "0.00",
    },
    {
      headerName: "P. Unitario",
      field: "precio_unitario",
      width: 130,
      cellStyle: { textAlign: "right" },
      valueFormatter: (params) => {
        const tipoMoneda = params.data?.tipo_moneda || "PEN";
        const moneda = tipoMoneda === "USD" ? "$" : "S/";
        const valor = parseFloat(params.value) || 0;
        return `${moneda} ${valor.toFixed(2)}`;
      },
    },
    {
      headerName: "Subtotal",
      width: 130,
      cellStyle: { textAlign: "right", fontWeight: "bold" },
      valueFormatter: (params) => {
        const tipoMoneda = params.data?.tipo_moneda || "PEN";
        const moneda = tipoMoneda === "USD" ? "$" : "S/";
        const cantidad = params.data?.cantidad || 0;
        const precio = params.data?.precio_unitario || 0;
        const subtotal = cantidad * precio;
        return `${moneda} ${subtotal.toFixed(2)}`;
      },
    },
  ];

  return (
    <TableWithTitle<DetalleComprobanteElectronico>
      tableRef={tableGridRef}
      id="f-e.table-detalle-comprobante"
      title="Productos del Comprobante"
      columnDefs={columnDefs}
      rowData={detalles}
      loading={loading}
      rowSelection={false}
      pagination={false}
      domLayout="normal"
      getRowHeight={() => 55}
    />
  );
}
