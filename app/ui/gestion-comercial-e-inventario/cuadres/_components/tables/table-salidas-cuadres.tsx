"use client";

import TableWithTitle from "~/components/tables/table-with-title";
import { ColDef } from "ag-grid-community";
import { useMemo } from "react";
import { Button, Checkbox, Popconfirm, message, Tag } from "antd";
import { FaBan } from "react-icons/fa6";

import { useCuadresContext } from "../../_contexts/cuadres-context";

export default function TableSalidasCuadres() {
    const { salidas, loading, anular } = useCuadresContext();

    const handleAnular = async (headerId: number) => {
        try {
            await anular(headerId);
            message.success("Documento anulado correctamente");
        } catch (error) {
            message.error("Error al anular el documento");
        }
    };

    const columns = useMemo<ColDef[]>(() => [
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
            headerName: "Estado",
            field: "anulado",
            width: 90,
            cellRenderer: (p: any) => (
                <div className="flex items-center justify-center h-full">
                    {p.value ? (
                        <Tag color="error">ANULADO</Tag>
                    ) : (
                        <Tag color="success">ACTIVO</Tag>
                    )}
                </div>
            )
        },
        { headerName: "T.Salida", field: "tipo_ingreso", width: 120 },
        {
            headerName: "Total",
            field: "total",
            width: 100,
            pinned: "right",
            cellClass: "font-bold text-rose-700 text-right",
            valueFormatter: (p) => `S/. ${p.value?.toFixed(2) || "0.00"}`
        },
        {
            headerName: "Acciones",
            field: "headerId",
            width: 100,
            pinned: "right",
            cellRenderer: (p: any) => {
                const isAnulado = p.data.anulado;
                return (
                    <div className="flex items-center justify-center h-full">
                        <Popconfirm
                            title="¿Estás seguro de anular este documento?"
                            onConfirm={() => handleAnular(p.value)}
                            okText="Sí"
                            cancelText="No"
                            disabled={isAnulado}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<FaBan />}
                                disabled={isAnulado}
                                size="small"
                                className="flex items-center justify-center"
                            />
                        </Popconfirm>
                    </div>
                );
            }
        },
    ], [anular]);

    return (
        <TableWithTitle
            id="cuadres-salidas-table"
            title="Nota de Salidas"
            columnDefs={columns}
            rowData={salidas}
            loading={loading}
            className="h-full"
        />
    );
}
