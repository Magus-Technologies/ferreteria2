"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import { FormListFieldData, Tooltip } from "antd";
import { MdDelete } from "react-icons/md";
import { FormInstance } from "antd";

export function useColumnsPrestamo(
  onEliminar: (index: number) => void,
  form?: FormInstance
): ColDef<FormListFieldData>[] {
  return [
    {
      headerName: "Código",
      field: "name",
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        if (!form) return null;
        const codigo = form.getFieldValue(['productos', value, 'producto_codigo']);
        return (
          <div className="flex items-center h-full">
            <Tooltip title={codigo}>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {codigo}
              </div>
            </Tooltip>
          </div>
        );
      },
    },
    {
      headerName: "Descripción",
      field: "name",
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        if (!form) return null;
        const name = form.getFieldValue(['productos', value, 'producto_name']);
        return (
          <div className="flex items-center h-full">
            <Tooltip title={name}>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {name}
              </div>
            </Tooltip>
          </div>
        );
      },
    },
    {
      headerName: "Marca",
      field: "name",
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        if (!form) return null;
        const marca = form.getFieldValue(['productos', value, 'marca_name']);
        return (
          <div className="flex items-center h-full">
            {marca}
          </div>
        );
      },
    },
    {
      headerName: "Unidad",
      field: "name",
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        if (!form) return null;
        const unidad = form.getFieldValue(['productos', value, 'unidad_derivada_name']);
        return (
          <div className="flex items-center h-full">
            {unidad}
          </div>
        );
      },
    },
    {
      headerName: "Cantidad",
      field: "name",
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        if (!form) return null;
        const cantidad = form.getFieldValue(['productos', value, 'cantidad']);
        return (
          <div className="flex items-center h-full">
            {cantidad?.toFixed(2) || "0.00"}
          </div>
        );
      },
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
          <div className="flex items-center justify-center gap-2 h-full">
            <Tooltip title="Eliminar">
              <MdDelete
                onClick={() => onEliminar(index)}
                size={15}
                className="cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95"
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];
}
