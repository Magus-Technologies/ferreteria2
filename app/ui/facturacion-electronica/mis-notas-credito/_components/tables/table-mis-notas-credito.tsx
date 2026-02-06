"use client";

import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef } from "react";
import { ColDef } from "ag-grid-community";
import { useStoreFiltrosMisNotasCredito } from "../../_store/store-filtros-mis-notas-credito";
import useGetNotasCredito from "../../_hooks/use-get-notas-credito";
import { Tag } from "antd";
import dayjs from "dayjs";
import ButtonBase from "~/components/buttons/button-base";
import { FaFilePdf, FaPaperPlane } from "react-icons/fa";

export default function TableMisNotasCredito() {
  const gridRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosMisNotasCredito((state) => state.filtros);
  const { response, isLoading } = useGetNotasCredito({ where: filtros });

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Serie-Número",
        field: "serie",
        width: 150,
        valueGetter: (params) => `${params.data.serie}-${params.data.numero}`,
      },
      {
        headerName: "Fecha Emisión",
        field: "fecha_emision",
        width: 130,
        valueFormatter: (params) =>
          params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
      },
      {
        headerName: "Factura Afectada",
        field: "comprobante_afectado",
        width: 150,
        valueGetter: (params) =>
          params.data.comprobante_afectado
            ? `${params.data.comprobante_afectado.serie}-${params.data.comprobante_afectado.numero}`
            : "",
      },
      {
        headerName: "Motivo",
        field: "motivo_nota.descripcion",
        flex: 1,
        minWidth: 200,
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
        headerName: "Estado SUNAT",
        field: "estado_sunat",
        width: 140,
        cellRenderer: (params: any) => {
          const estado = params.value;
          let color = "default";
          if (estado === "Aceptado") color = "success";
          else if (estado === "Pendiente") color = "warning";
          else if (estado === "Rechazado") color = "error";
          return <Tag color={color}>{estado}</Tag>;
        },
      },
      {
        headerName: "Acciones",
        width: 200,
        cellRenderer: (params: any) => (
          <div className="flex gap-2 items-center h-full">
            <ButtonBase size="sm" color="info" className="flex items-center gap-1">
              <FaPaperPlane />
              Enviar
            </ButtonBase>
            <ButtonBase size="sm" color="danger" className="flex items-center gap-1">
              <FaFilePdf />
              PDF
            </ButtonBase>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="ag-theme-quartz" style={{ height: 500, width: "100%" }}>
      <AgGridReact
        ref={gridRef}
        rowData={response}
        columnDefs={columnDefs}
        loading={isLoading}
        pagination={true}
        paginationPageSize={20}
        domLayout="normal"
      />
    </div>
  );
}
