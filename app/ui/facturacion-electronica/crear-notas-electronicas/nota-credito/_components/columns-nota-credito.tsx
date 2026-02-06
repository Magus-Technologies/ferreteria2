"use client";

import { FormInstance } from "antd";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import InputBase from "~/app/_components/form/inputs/input-base";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import { MdDelete } from "react-icons/md";

export function useColumnsNotaCredito({
  remove,
  form,
}: {
  remove: (index: number | number[]) => void;
  form: FormInstance<any>;
}): ColDef[] {
  return [
    {
      headerName: "#",
      field: "name",
      width: 40,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center text-[10px]">
          {(value ?? 0) + 1}
        </div>
      ),
      pinned: "left",
      cellStyle: { padding: "0 2px", border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
    },
    {
      headerName: "#",
      field: "name",
      width: 40,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center">
          <button
            type="button"
            onClick={() => remove(value)}
            className="text-destructive hover:text-destructive/80 p-0"
          >
            <MdDelete size={14} />
          </button>
        </div>
      ),
      pinned: "left",
      cellStyle: { padding: "0 2px", border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
    },
    {
      headerName: "Código",
      field: "name",
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full p-0">
          <InputBase
            propsForm={{
              name: [value, "codigo"],
            }}
            placeholder=""
            className="w-full !border-0 !shadow-none !rounded-none text-[10px] h-full"
            size="small"
          />
        </div>
      ),
      cellStyle: { padding: 0, border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
    },
    {
      headerName: "Descripción",
      field: "name",
      width: 300,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full p-0">
          <InputBase
            propsForm={{
              name: [value, "descripcion"],
              rules: [{ required: true, message: "" }],
            }}
            placeholder="Descripción del producto"
            className="w-full !border-0 !shadow-none !rounded-none text-[10px] h-full"
            size="small"
            uppercase={false}
          />
        </div>
      ),
      cellStyle: { padding: 0, border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
    },
    {
      headerName: "U. Medida",
      field: "name",
      width: 80,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full p-0">
          <InputBase
            propsForm={{
              name: [value, "unidad_medida"],
            }}
            placeholder="NIU"
            className="w-full !border-0 !shadow-none !rounded-none text-[10px] h-full"
            size="small"
          />
        </div>
      ),
      cellStyle: { padding: 0, border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
    },
    {
      headerName: "Cantidad",
      field: "name",
      width: 80,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full p-0">
          <InputNumberBase
            propsForm={{
              name: [value, "cantidad"],
              rules: [{ required: true, message: "" }],
            }}
            min={0}
            precision={2}
            className="w-full !border-0 !shadow-none !rounded-none text-[10px] h-full"
            size="small"
            onChange={(cantidad) => {
              const precio = Number(form.getFieldValue(["productos", value, "precio_venta"]) || 0);
              const subtotal = Number(cantidad || 0) * precio;
              form.setFieldValue(["productos", value, "subtotal"], subtotal);
            }}
          />
        </div>
      ),
      cellStyle: { padding: 0, border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
    },
    {
      headerName: "P. Unitario",
      field: "name",
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full p-0">
          <InputNumberBase
            propsForm={{
              name: [value, "precio_venta"],
              rules: [{ required: true, message: "" }],
            }}
            min={0}
            precision={2}
            className="w-full !border-0 !shadow-none !rounded-none text-[10px] h-full"
            size="small"
            onChange={(precio) => {
              const cantidad = Number(form.getFieldValue(["productos", value, "cantidad"]) || 0);
              const subtotal = cantidad * Number(precio || 0);
              form.setFieldValue(["productos", value, "subtotal"], subtotal);
            }}
          />
        </div>
      ),
      cellStyle: { padding: 0, border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
    },
    {
      headerName: "Subtotal",
      field: "name",
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const cantidad = Number(form.getFieldValue(["productos", value, "cantidad"]) || 0);
        const precio = Number(form.getFieldValue(["productos", value, "precio_venta"]) || 0);
        const subtotal = cantidad * precio;
        return (
          <div className="flex items-center h-full justify-end pr-1 text-[10px] font-semibold">
            {subtotal.toFixed(2)}
          </div>
        );
      },
      cellStyle: { padding: "0 2px", border: "1px solid var(--color-border)" },
      headerClass: "text-[10px] font-bold",
      pinned: "right",
    },
  ];
}
