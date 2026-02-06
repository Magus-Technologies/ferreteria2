"use client";

import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef } from "react";
import { ColDef } from "ag-grid-community";
import ButtonBase from "~/components/buttons/button-base";
import { FaPlus, FaTrash } from "react-icons/fa";
import { InputNumber } from "antd";

interface TableDetallesNotaCreditoProps {
  factura: any;
  detalles: any[];
  setDetalles: (detalles: any[]) => void;
}

export default function TableDetallesNotaCredito({
  factura,
  detalles,
  setDetalles,
}: TableDetallesNotaCreditoProps) {
  const gridRef = useRef<AgGridReact>(null);

  const agregarDetalle = () => {
    const nuevoDetalle = {
      id: Date.now(),
      producto_id: null,
      descripcion: "",
      cantidad: 1,
      precio_unitario: 0,
      total: 0,
    };
    setDetalles([...detalles, nuevoDetalle]);
  };

  const eliminarDetalle = (id: number) => {
    setDetalles(detalles.filter((d) => d.id !== id));
  };

  const actualizarDetalle = (id: number, campo: string, valor: any) => {
    setDetalles(
      detalles.map((d) => {
        if (d.id === id) {
          const updated = { ...d, [campo]: valor };
          updated.total = updated.cantidad * updated.precio_unitario;
          return updated;
        }
        return d;
      })
    );
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Descripción",
        field: "descripcion",
        flex: 1,
        editable: true,
      },
      {
        headerName: "Cantidad",
        field: "cantidad",
        width: 120,
        cellRenderer: (params: any) => (
          <InputNumber
            min={0.01}
            value={params.value}
            onChange={(value) =>
              actualizarDetalle(params.data.id, "cantidad", value || 0)
            }
            className="w-full"
          />
        ),
      },
      {
        headerName: "Precio Unit.",
        field: "precio_unitario",
        width: 120,
        cellRenderer: (params: any) => (
          <InputNumber
            min={0}
            value={params.value}
            onChange={(value) =>
              actualizarDetalle(params.data.id, "precio_unitario", value || 0)
            }
            className="w-full"
            prefix="S/"
          />
        ),
      },
      {
        headerName: "Total",
        field: "total",
        width: 120,
        valueFormatter: (params) =>
          params.value ? `S/ ${Number(params.value).toFixed(2)}` : "S/ 0.00",
        cellStyle: { textAlign: "right", fontWeight: "600" },
      },
      {
        headerName: "",
        width: 80,
        cellRenderer: (params: any) => (
          <ButtonBase
            size="sm"
            color="danger"
            onClick={() => eliminarDetalle(params.data.id)}
            className="flex items-center gap-1"
          >
            <FaTrash />
          </ButtonBase>
        ),
      },
    ],
    [detalles]
  );

  const totalGeneral = useMemo(() => {
    return detalles.reduce((sum, d) => sum + (d.total || 0), 0);
  }, [detalles]);

  return (
    <div>
      <div className="mb-2">
        <ButtonBase
          size="sm"
          color="success"
          onClick={agregarDetalle}
          className="flex items-center gap-1"
        >
          <FaPlus />
          Agregar Detalle
        </ButtonBase>
      </div>

      <div className="ag-theme-quartz" style={{ height: 300, width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={detalles}
          columnDefs={columnDefs}
          domLayout="normal"
        />
      </div>

      <div className="mt-2 text-right">
        <strong>Total: S/ {totalGeneral.toFixed(2)}</strong>
      </div>
    </div>
  );
}
