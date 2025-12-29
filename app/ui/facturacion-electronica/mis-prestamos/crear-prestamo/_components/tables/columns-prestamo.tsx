"use client";

import { ColDef } from "ag-grid-community";
import { Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ProductoPrestamo } from "../../_types/prestamo.types";

export function useColumnsPrestamo(
  onEliminar: (index: number) => void
): ColDef<ProductoPrestamo>[] {
  return [
    {
      headerName: "Código",
      field: "producto_codigo",
      width: 120,
    },
    {
      headerName: "Descripción",
      field: "producto_name",
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: "Marca",
      field: "marca_name",
      width: 120,
    },
    {
      headerName: "Unidad",
      field: "unidad_derivada_name",
      width: 100,
    },
    {
      headerName: "Cantidad",
      field: "cantidad",
      width: 100,
      valueFormatter: (params) => params.value?.toFixed(2) || "0.00",
    },
    // Comentado: Solo se maneja por cantidad
    // {
    //   headerName: "Costo Unit.",
    //   field: "costo",
    //   width: 120,
    //   valueFormatter: (params) => `S/. ${params.value?.toFixed(4) || "0.0000"}`,
    // },
    // {
    //   headerName: "Subtotal",
    //   field: "subtotal",
    //   width: 120,
    //   valueFormatter: (params) => `S/. ${params.value?.toFixed(2) || "0.00"}`,
    //   cellStyle: { fontWeight: "bold", color: "#1e40af" },
    // },
    {
      headerName: "Acciones",
      width: 100,
      pinned: "right",
      cellRenderer: (params: any) => {
        const index = params.node.rowIndex;
        return (
          <div className="flex items-center justify-center h-full">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onEliminar(index)}
              size="small"
            />
          </div>
        );
      },
    },
  ];
}
