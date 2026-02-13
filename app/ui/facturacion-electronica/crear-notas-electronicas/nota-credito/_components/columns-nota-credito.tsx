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
        <div className="flex items-center h-full py-1">
          <InputBase
            propsForm={{ name: [value, "codigo"], hasFeedback: false }}
            placeholder="Código"
            size="small"
            uppercase={false}
            formWithMessage={false}
          />
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
        <div className="flex items-center h-full py-1">
          <InputBase
            propsForm={{
              name: [value, "descripcion"],
              rules: [{ required: true, message: "Requerido" }],
              hasFeedback: false,
            }}
            placeholder="Descripción"
            size="small"
            uppercase={false}
            formWithMessage={false}
          />
        </div>
      ),
    },
    {
      headerName: "U.M",
      colId: "unidad_medida",
      field: "name",
      width: 90,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full py-1">
          <InputBase
            propsForm={{ name: [value, "unidad_medida"], hasFeedback: false }}
            placeholder="NIU"
            size="small"
            uppercase={false}
            formWithMessage={false}
          />
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
        <div className="flex items-center h-full py-1">
          <InputNumberBase
            propsForm={{
              name: [value, "cantidad"],
              rules: [{ required: true, message: "Requerido" }],
              hasFeedback: false,
            }}
            min={0}
            precision={2}
            size="small"
            formWithMessage={false}
            onChange={(cantidad) => {
              const precio = Number(form.getFieldValue(["productos", value, "precio_venta"]) || 0);
              form.setFieldValue(["productos", value, "subtotal"], Number(cantidad || 0) * precio);
            }}
          />
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
        <div className="flex items-center h-full py-1">
          <InputNumberBase
            propsForm={{
              name: [value, "precio_venta"],
              rules: [{ required: true, message: "Requerido" }],
              hasFeedback: false,
            }}
            min={0}
            precision={2}
            size="small"
            formWithMessage={false}
            onChange={(precio) => {
              const cantidad = Number(form.getFieldValue(["productos", value, "cantidad"]) || 0);
              form.setFieldValue(["productos", value, "subtotal"], cantidad * Number(precio || 0));
            }}
          />
        </div>
      ),
    },
    {
      headerName: "Subtotal",
      colId: "subtotal",
      field: "name",
      width: 120,
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const subtotal = Number(form.getFieldValue(["productos", value, "subtotal"]) || 0);
        return (
          <div className="flex items-center h-full font-semibold">
            S/ {subtotal.toFixed(2)}
          </div>
        );
      },
    },
    {
      headerName: "Acciones",
      colId: "acciones",
      field: "name",
      width: 90,
      pinned: "right",
      lockPosition: "right",
      suppressMovable: true,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center justify-center h-full">
          <button
            type="button"
            onClick={() => remove(value)}
            className="text-red-500 hover:text-red-700"
            title="Eliminar"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
  ];
}
