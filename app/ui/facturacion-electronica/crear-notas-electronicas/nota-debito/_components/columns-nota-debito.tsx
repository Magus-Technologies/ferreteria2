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
        <div className="flex items-center h-full py-1">
          <InputBase
            propsForm={{
              name: [value, "codigo"],
            }}
            placeholder="Código"
            className="w-full"
            formWithMessage={false}
          />
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
        <div className="flex items-center h-full py-1">
          <InputBase
            propsForm={{
              name: [value, "descripcion"],
              rules: [{ required: true, message: "" }],
            }}
            placeholder="Descripción del producto"
            className="w-full"
            uppercase={false}
            formWithMessage={false}
          />
        </div>
      ),
    },
    {
      colId: "unidad_medida",
      headerName: "U.M",
      field: "name",
      width: 100,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1">
          <InputBase
            propsForm={{
              name: [value, "unidad_medida"],
            }}
            placeholder="NIU"
            className="w-full"
            formWithMessage={false}
          />
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
        <div className="flex items-center h-full py-1">
          <InputNumberBase
            propsForm={{
              name: [value, "cantidad"],
              rules: [{ required: true, message: "" }],
            }}
            min={0}
            precision={2}
            className="w-full"
            formWithMessage={false}
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
      colId: "precio_unitario",
      headerName: "P. Unit",
      field: "name",
      width: 120,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1">
          <InputNumberBase
            propsForm={{
              name: [value, "precio_venta"],
              rules: [{ required: true, message: "" }],
            }}
            min={0}
            precision={2}
            className="w-full"
            formWithMessage={false}
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
      colId: "subtotal",
      headerName: "Subtotal",
      field: "name",
      width: 120,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const cantidad = Number(form.getFieldValue(["productos", value, "cantidad"]) || 0);
        const precio = Number(form.getFieldValue(["productos", value, "precio_venta"]) || 0);
        const subtotal = cantidad * precio;
        return (
          <div className="flex items-center h-full justify-end pr-2 py-1">
            {subtotal.toFixed(2)}
          </div>
        );
      },
    },
    {
      colId: "acciones",
      headerName: "Acciones",
      field: "name",
      width: 80,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center py-1">
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
