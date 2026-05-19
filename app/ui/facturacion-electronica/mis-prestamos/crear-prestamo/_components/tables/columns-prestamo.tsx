"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import { FormListFieldData, InputNumber, Select, Tooltip } from "antd";
import { MdDelete } from "react-icons/md";
import { FormInstance } from "antd";
import { useEffect, useState } from "react";
import type {
  FormCreatePrestamo,
  UnidadDisponiblePrestamo,
} from "../../_types/prestamo.types";

function CantidadCell({
  form,
  index,
}: {
  form: FormInstance<FormCreatePrestamo>;
  index: number;
}) {
  const cantidadForm = Number(form.getFieldValue(["productos", index, "cantidad"]) ?? 0);
  const [cantidad, setCantidad] = useState<number | null>(
    Number.isFinite(cantidadForm) ? cantidadForm : 0
  );

  useEffect(() => {
    setCantidad(Number.isFinite(cantidadForm) ? cantidadForm : 0);
  }, [cantidadForm, index]);

  return (
    <div className="flex items-center h-full w-full pr-2">
      <InputNumber
        size="small"
        min={0}
        precision={2}
        className="w-full"
        value={cantidad}
        onChange={(value) => {
          const nextCantidad = Number(value ?? 0);
          setCantidad(nextCantidad);
          form.setFieldValue(["productos", index, "cantidad"], nextCantidad);
        }}
      />
    </div>
  );
}

function UnidadCell({
  form,
  index,
}: {
  form: FormInstance<FormCreatePrestamo>;
  index: number;
}) {
  const unidades =
    (form.getFieldValue([
      "productos",
      index,
      "unidades_disponibles",
    ]) as UnidadDisponiblePrestamo[] | undefined) ?? [];
  const unidadDerivadaId = form.getFieldValue([
    "productos",
    index,
    "unidad_derivada_id",
  ]) as number | undefined;
  const unidadDerivadaName = form.getFieldValue([
    "productos",
    index,
    "unidad_derivada_name",
  ]) as string | undefined;
  const [value, setValue] = useState<number | undefined>(unidadDerivadaId);

  useEffect(() => {
    setValue(unidadDerivadaId);
  }, [unidadDerivadaId, index]);

  if (!unidades.length) {
    return <div className="flex items-center h-full">{unidadDerivadaName || "-"}</div>;
  }

  return (
    <div className="flex items-center h-full w-full pr-2">
      <Select
        size="small"
        className="w-full"
        value={value}
        options={unidades.map((item) => ({
          value: item.unidad_derivada.id,
          label: item.unidad_derivada.name,
        }))}
        onChange={(nextUnidadId: number) => {
          const unidad = unidades.find(
            (item) => item.unidad_derivada.id === nextUnidadId
          );
          if (!unidad) return;

          setValue(nextUnidadId);
          form.setFieldValue(
            ["productos", index, "unidad_derivada_id"],
            unidad.unidad_derivada.id
          );
          form.setFieldValue(
            ["productos", index, "unidad_derivada_name"],
            unidad.unidad_derivada.name
          );
          form.setFieldValue(
            ["productos", index, "unidad_derivada_factor"],
            Number(unidad.factor ?? 1)
          );
        }}
      />
    </div>
  );
}

export function useColumnsPrestamo(
  onEliminar: (index: number) => void,
  form?: FormInstance<FormCreatePrestamo>
): ColDef<FormListFieldData>[] {
  return [
    {
      colId: "codigo",
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
      colId: "descripcion",
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
      colId: "marca",
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
      colId: "unidad",
      headerName: "Unidad",
      field: "name",
      width: 150,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        if (!form) return null;
        return <UnidadCell form={form} index={Number(value)} />;
      },
    },
    {
      colId: "cantidad",
      headerName: "Cantidad",
      field: "name",
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        if (!form) return null;
        return <CantidadCell form={form} index={Number(value)} />;
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
      colId: "acciones",
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
