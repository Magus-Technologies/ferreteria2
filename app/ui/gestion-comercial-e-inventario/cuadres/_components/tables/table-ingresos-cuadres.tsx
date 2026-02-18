"use client";

import TableWithTitle from "~/components/tables/table-with-title";
import { ColDef } from "ag-grid-community";
import { useMemo } from "react";
import { Checkbox } from "antd";

import { useCuadresContext } from "../../_contexts/cuadres-context";

export default function TableIngresosCuadres() {
    const { ingresos, loading } = useCuadresContext();

    const columns = useMemo<ColDef[]>(() => [
        {
            headerName: "#",
            valueGetter: "node.rowIndex + 1",
            width: 50,
            pinned: "left"
        },
        { headerName: "Fecha", field: "fecha", width: 100 },
        { headerName: "Numero", field: "numero", width: 110, cellClass: "font-mono" },
        { headerName: "Descripcion", field: "descripcion", flex: 1, minWidth: 200 },
        { headerName: "Marca", field: "marca", width: 100 },
        {
            headerName: "Cantidad",
            field: "cantidad",
            width: 90,
            valueFormatter: (p) => p.value?.toFixed(2) || "0.00",
            cellClass: "text-right"
        },
        { headerName: "U.Medida", field: "unidad_medida", width: 100 },
        {
            headerName: "Precio",
            field: "precio",
            width: 90,
            valueFormatter: (p) => p.value?.toFixed(2) || "0.00",
            cellClass: "text-right"
        },
        { headerName: "Proveedor", field: "proveedor", width: 150 },
        { headerName: "Observacion", field: "observacion", width: 150 },
        { headerName: "Registra", field: "usuario", width: 100 },
        {
            headerName: "Anulado",
            field: "anulado",
            width: 80,
            cellRenderer: (p: any) => (
                <div className="flex items-center justify-center h-full">
                    <Checkbox checked={p.value} disabled />
                </div>
            )
        },
        { headerName: "T.Ingreso", field: "tipo_ingreso", width: 120 },
        {
            headerName: "Total",
            field: "total",
            width: 100,
            pinned: "right",
            cellClass: "font-bold text-blue-700 text-right",
            valueFormatter: (p) => `S/. ${p.value?.toFixed(2) || "0.00"}`
        },
    ], []);

    return (
        <TableWithTitle
            id="cuadres-ingresos-table"
            title="Nota de Ingresos"
            columnDefs={columns}
            rowData={ingresos}
            loading={loading}
            className="h-full"
        />
    );
}
