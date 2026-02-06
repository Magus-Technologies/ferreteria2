"use client";

import { FormInstance } from "antd";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";
import InputBase from "~/app/_components/form/inputs/input-base";
import InputNumberBase from "~/app/_components/form/inputs/input-number-base";
import { MdDelete } from "react-icons/md";

export function useColumnsNotaDebito({
  remove,
  form,
}: {
  remove: (index: number | number[]) => void;
  form: FormInstance<FormCreateNotaDebito>;
}): ColDef[] {
  return [
    {
      headerName: "#",
      field: "name",
      width: 60,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center">
          {(value ?? 0) + 1}
        </div>
      ),
      pinned: "left",
    },
    {
      headerName: "Código",
      field: "name",
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <InputBase
            propsForm={{
              name: [value, "codigo"],
            }}
            placeholder="Código"
            className="w-full"
          />
        </div>
      ),
    },
    {
      headerName: "Descripción",
      field: "name",
      width: 250,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <InputBase
            propsForm={{
              name: [value, "descripcion"],
              rules: [{ required: true, message: "" }],
            }}
            placeholder="Descripción del producto"
            className="w-full"
            uppercase={false}
          />
        </div>
      ),
    },
    {
      headerName: "U. Medida",
      field: "name",
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <InputBase
            propsForm={{
              name: [value, "unidad_medida"],
            }}
            placeholder="NIU"
            className="w-full"
          />
        </div>
      ),
    },
    {
      headerName: "Cantidad",
      field: "name",
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <InputNumberBase
            propsForm={{
              name: [value, "cantidad"],
              rules: [{ required: true, message: "" }],
            }}
            min={0}
            precision={2}
            className="w-full"
            onChange={(cantidad) => {
              const precio = Number(form.getFieldValue(["productos", value, "precio_venta"]) || 0);
              const subtotal = Number(cantidad || 0) * precio;
              form.setFieldValue(["productos", value, "subtotal"], subtotal);
            }}
          />
        </div>
      ),
    },
    {
      headerName: "P. Unitario",
      field: "name",
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full">
          <InputNumberBase
            propsForm={{
              name: [value, "precio_venta"],
              rules: [{ required: true, message: "" }],
            }}
            min={0}
            precision={2}
            className="w-full"
            onChange={(precio) => {
              const cantidad = Number(form.getFieldValue(["productos", value, "cantidad"]) || 0);
              const subtotal = cantidad * Number(precio || 0);
              form.setFieldValue(["productos", value, "subtotal"], subtotal);
            }}
          />
        </div>
      ),
    },
    {
      headerName: "Subtotal",
      field: "name",
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const cantidad = Number(form.getFieldValue(["productos", value, "cantidad"]) || 0);
        const precio = Number(form.getFieldValue(["productos", value, "precio_venta"]) || 0);
        const subtotal = cantidad * precio;
        return (
          <div className="flex items-center h-full justify-end pr-2">
            {subtotal.toFixed(2)}
          </div>
        );
      },
    },
    {
      headerName: "",
      field: "name",
      width: 80,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center">
          <button
            type="button"
            onClick={() => remove(value)}
            className="text-red-500 hover:text-red-700"
          >
            <MdDelete size={20} />
          </button>
        </div>
      ),
      pinned: "right",
    },
  ];
}
