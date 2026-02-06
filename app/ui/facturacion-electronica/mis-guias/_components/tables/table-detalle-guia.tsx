"use client";

import React, { useRef } from "react";
import TableWithTitle from "~/components/tables/table-with-title";
import { AgGridReact } from "ag-grid-react";
import { useStoreGuiaSeleccionada } from "./table-mis-guias";
import { ColDef } from "ag-grid-community";
import type { DetalleGuia } from "~/lib/api/guia-remision";

export default function TableDetalleGuia() {
  const tableRef = useRef<AgGridReact>(null);
  const guiaSeleccionada = useStoreGuiaSeleccionada((state) => state.guia);

  const columnDefs: ColDef<DetalleGuia>[] = [
    {
      headerName: "Código",
      field: "producto.cod_producto",
      width: 120,
      filter: true,
      valueGetter: (params) => params.data?.producto?.cod_producto || '',
    },
    {
      headerName: "Producto",
      field: "producto.name",
      flex: 1,
      filter: true,
      valueGetter: (params) => params.data?.producto?.name || '',
    },
    {
      headerName: "Unidad",
      field: "unidadDerivadaInmutable.name",
      width: 100,
      filter: true,
      valueGetter: (params) => params.data?.unidadDerivadaInmutable?.name || params.data?.unidad_derivada_inmutable_name || '',
    },
    {
      headerName: "Cantidad",
      field: "cantidad",
      width: 100,
      type: "numericColumn",
      valueFormatter: (params) => {
        if (params.value == null) return "";
        return Number(params.value).toFixed(2);
      },
    },
    {
      headerName: "Almacén",
      colId: "almacen",
      width: 150,
      filter: true,
      valueGetter: (params) => {
        // El almacén viene del producto_almacen, no directamente del detalle
        return 'N/A'; // TODO: Agregar relación con almacén en el backend
      },
    },
  ];

  const detalles = guiaSeleccionada?.detalles || [];

  return (
    <div className="w-full mt-4" style={{ height: "250px" }}>
      <TableWithTitle<DetalleGuia>
        id="detalle-guia"
        title="DETALLE DE PRODUCTOS"
        loading={false}
        columnDefs={columnDefs}
        rowData={detalles}
        tableRef={tableRef}
      />
    </div>
  );
}
