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
      width: 60,
      pinned: "left",
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center bg-gray-50">
          {(value ?? 0) + 1}
        </div>
      ),
    },
    {
      headerName: "Acciones",
      field: "name",
      width: 80,
      pinned: "left",
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full justify-center bg-gray-50">
          <button
            type="button"
            onClick={() => remove(value)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
            title="Eliminar producto"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
    {
      headerName: "Código",
      field: "name",
      width: 120,
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full px-2">
          <InputBase
            propsForm={{
              name: [value, "codigo"],
            }}
            placeholder="Código"
            className="w-full bg-white border border-gray-200"
            size="small"
          />
        </div>
      ),
    },
    {
      headerName: "Descripción",
      field: "name",
      width: 350,
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full px-2">
          <InputBase
            propsForm={{
              name: [value, "descripcion"],
              rules: [{ required: true, message: "Requerido" }],
            }}
            placeholder="Descripción del producto"
            className="w-full bg-white border border-gray-200"
            size="small"
            uppercase={false}
          />
        </div>
      ),
    },
    {
      headerName: "U. Medida",
      field: "name",
      width: 110,
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full px-2">
          <InputBase
            propsForm={{
              name: [value, "unidad_medida"],
            }}
            placeholder="NIU"
            className="w-full bg-white border border-gray-200"
            size="small"
          />
        </div>
      ),
    },
    {
      headerName: "Cantidad",
      field: "name",
      width: 120,
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full px-2">
          <InputNumberBase
            propsForm={{
              name: [value, "cantidad"],
              rules: [{ required: true, message: "Requerido" }],
            }}
            min={0}
            precision={2}
            className="w-full bg-blue-50 border-blue-200"
            size="small"
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
      width: 130,
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className="flex items-center h-full px-2">
          <InputNumberBase
            propsForm={{
              name: [value, "precio_venta"],
              rules: [{ required: true, message: "Requerido" }],
            }}
            min={0}
            precision={2}
            className="w-full bg-green-50 border-green-200"
            size="small"
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
      width: 140,
      pinned: "right",
      suppressSizeToFit: true,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const subtotal = Number(form.getFieldValue(["productos", value, "subtotal"]) || 0);
        return (
          <div className="flex items-center h-full justify-end pr-4 font-bold text-gray-700 bg-gray-50">
            {subtotal.toFixed(2)}
          </div>
        );
      },
    },
  ];
}
