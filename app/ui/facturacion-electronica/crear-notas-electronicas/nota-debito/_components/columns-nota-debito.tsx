"use client";

import { FormInstance } from "antd";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";

export function useColumnsNotaDebito({
  form,
}: {
  remove?: (index: number | number[]) => void;
  form: FormInstance<FormCreateNotaDebito>;
}): ColDef[] {
  const get = (index: number, key: any) =>
    form.getFieldValue(["productos", index, key]);

  return [
    {
      colId: "item",
      headerName: "Ítem",
      field: "name",
      width: 60,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center py-1">
          {(value ?? 0) + 1}
        </div>
      ),
      pinned: "left",
    },
    {
      colId: "codigo",
      headerName: "Código",
      field: "name",
      width: 120,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1 text-sm">
          {get(value, "codigo") || "—"}
        </div>
      ),
    },
    {
      colId: "descripcion",
      headerName: "Descripción",
      field: "name",
      width: 250,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1 text-sm">
          {get(value, "descripcion") || "—"}
        </div>
      ),
    },
    {
      colId: "unidad_medida",
      headerName: "Unidad",
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
      colId: "cantidad",
      headerName: "Cant.",
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
      colId: "precio_unitario",
      headerName: "P. Unit",
      field: "name",
      width: 120,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center justify-end h-full py-1 text-sm pr-2">
          S/ {Number(get(value, "precio_venta") || 0).toFixed(2)}
        </div>
      ),
    },
    {
      colId: "subtotal",
      headerName: "Subtotal",
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
