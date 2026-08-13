"use client";

import { FormInstance } from "antd";
import { ColDef, ICellRendererParams } from "ag-grid-community";

export function useColumnsNotaCredito({
  form,
}: {
  remove?: (index: number | number[]) => void;
  form: FormInstance<any>;
}): ColDef[] {
  const get = (index: number, key: string) =>
    form.getFieldValue(["productos", index, key]);

  return [
    {
      headerName: "Ítem",
      colId: "item",
      field: "name",
      width: 70,
      lockPosition: "left",
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center justify-center h-full">
          {(value ?? 0) + 1}
        </div>
      ),
    },
    {
      headerName: "Código",
      colId: "codigo",
      field: "name",
      width: 130,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1 text-sm">
          {get(value, "codigo") || "—"}
        </div>
      ),
    },
    {
      headerName: "Descripción",
      colId: "descripcion",
      field: "name",
      flex: 1,
      minWidth: 300,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1 text-sm">
          {get(value, "descripcion") || "—"}
        </div>
      ),
    },
    {
      headerName: "Unidad",
      colId: "unidad_medida",
      field: "name",
      width: 100,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1 text-sm">
          {get(value, "unidad_medida") || "—"}
        </div>
      ),
    },
    {
      headerName: "Cant.",
      colId: "cantidad",
      field: "name",
      width: 100,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center justify-end h-full py-1 text-sm pr-2">
          {Number(get(value, "cantidad") || 0).toFixed(2)}
        </div>
      ),
    },
    {
      headerName: "P. Unit",
      colId: "precio_unitario",
      field: "name",
      width: 110,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center justify-end h-full py-1 text-sm pr-2">
          S/ {Number(get(value, "precio_venta") || 0).toFixed(2)}
        </div>
      ),
    },
    {
      headerName: "Subtotal",
      colId: "subtotal",
      field: "name",
      width: 120,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center justify-end h-full font-semibold pr-2">
          S/ {Number(get(value, "subtotal") || 0).toFixed(2)}
        </div>
      ),
    },
  ];
}
