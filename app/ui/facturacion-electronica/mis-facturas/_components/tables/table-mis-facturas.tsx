"use client";

import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { ColDef } from "ag-grid-community";
import { useStoreFiltrosMisFacturas } from "../../_store/store-filtros-mis-facturas";
import useGetFacturas from "../../_hooks/use-get-facturas";
import { Tag } from "antd";
import dayjs from "dayjs";
import { FaFileInvoice, FaFilePdf } from "react-icons/fa";
import ButtonBase from "~/components/buttons/button-base";
import ModalCrearNotaCredito from "../modals/modal-crear-nota-credito";
import ModalCrearNotaDebito from "../modals/modal-crear-nota-debito";

export default function TableMisFacturas() {
  const gridRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosMisFacturas((state) => state.filtros);
  const { response, isLoading } = useGetFacturas({ where: filtros });
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [modalNCOpen, setModalNCOpen] = useState(false);
  const [modalNDOpen, setModalNDOpen] = useState(false);

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
        headerName: "Cliente",
        field: "comprobante_electronico.cliente.nombre_completo",
        flex: 1,
        minWidth: 200,
      },
      {
        headerName: "RUC/DNI",
        field: "comprobante_electronico.cliente.numero_documento",
        width: 120,
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
        width: 280,
        cellRenderer: (params: any) => (
          <div className="flex gap-2 items-center h-full">
            <ButtonBase
              size="sm"
              color="success"
              onClick={() => {
                setFacturaSeleccionada(params.data);
                setModalNCOpen(true);
              }}
            >
              Nota Crédito
            </ButtonBase>
            <ButtonBase
              size="sm"
              color="warning"
              onClick={() => {
                setFacturaSeleccionada(params.data);
                setModalNDOpen(true);
              }}
            >
              Nota Débito
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
    <>
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

      <ModalCrearNotaCredito
        open={modalNCOpen}
        setOpen={setModalNCOpen}
        factura={facturaSeleccionada}
      />

      <ModalCrearNotaDebito
        open={modalNDOpen}
        setOpen={setModalNDOpen}
        factura={facturaSeleccionada}
      />
    </>
  );
}
