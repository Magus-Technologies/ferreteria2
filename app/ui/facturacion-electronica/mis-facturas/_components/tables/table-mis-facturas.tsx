"use client";

import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { ColDef } from "ag-grid-community";
import { useStoreFiltrosMisFacturas } from "../../_store/store-filtros-mis-facturas";
import useGetFacturas from "../../_hooks/use-get-facturas";
import { Tag } from "antd";
import dayjs from "dayjs";
import { FaFilePdf } from "react-icons/fa";
import ButtonBase from "~/components/buttons/button-base";
import ModalCrearNotaCredito from "../modals/modal-crear-nota-credito";
import ModalCrearNotaDebito from "../modals/modal-crear-nota-debito";
import TableBase from "~/components/tables/table-base";

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
        valueGetter: (params) => `${params.data.serie}-${String(params.data.correlativo).padStart(8, '0')}`,
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
        field: "cliente_razon_social",
        flex: 1,
        minWidth: 200,
      },
      {
        headerName: "RUC/DNI",
        field: "cliente_numero_documento",
        width: 120,
      },
      {
        headerName: "Total",
        field: "importe_total",
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
          if (estado === "ACEPTADO" || estado === "ACEPTADO_CON_OBSERVACIONES") color = "success";
          else if (estado === "PENDIENTE") color = "warning";
          else if (estado === "RECHAZADO") color = "error";
          return <Tag color={color}>{estado}</Tag>;
        },
      },
      {
        headerName: "Acciones",
        width: 400,
        cellRenderer: (params: any) => {
          const isAceptado = params.data.estado_sunat === "ACEPTADO" || 
                            params.data.estado_sunat === "ACEPTADO_CON_OBSERVACIONES";
          const isPendiente = params.data.estado_sunat === "PENDIENTE";
          
          return (
            <div className="flex gap-2 items-center h-full">
              {/* Ver XML */}
              <ButtonBase
                size="sm"
                color="info"
                onClick={() => {
                  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                  window.open(`${apiUrl}/api/facturas/comprobante/${params.data.id}/xml`, '_blank');
                }}
                title="Ver XML"
              >
                XML
              </ButtonBase>

              {/* Enviar a SUNAT - solo si está pendiente */}
              {isPendiente && (
                <ButtonBase
                  size="sm"
                  color="warning"
                  onClick={() => {
                    // TODO: Implementar envío a SUNAT
                    console.log('Enviar a SUNAT:', params.data.id);
                  }}
                  title="Enviar a SUNAT"
                >
                  Enviar SUNAT
                </ButtonBase>
              )}

              {/* Nota Crédito - solo si está aceptado */}
              {isAceptado && (
                <ButtonBase
                  size="sm"
                  color="success"
                  onClick={() => {
                    setFacturaSeleccionada(params.data);
                    setModalNCOpen(true);
                  }}
                  title="Crear Nota de Crédito"
                >
                  N. Crédito
                </ButtonBase>
              )}

              {/* Nota Débito - solo si está aceptado */}
              {isAceptado && (
                <ButtonBase
                  size="sm"
                  color="danger"
                  onClick={() => {
                    setFacturaSeleccionada(params.data);
                    setModalNDOpen(true);
                  }}
                  title="Crear Nota de Débito"
                >
                  N. Débito
                </ButtonBase>
              )}

              {/* PDF */}
              <ButtonBase 
                size="sm" 
                color="danger" 
                className="flex items-center gap-1"
                onClick={() => {
                  // TODO: Implementar descarga de PDF
                  console.log('Descargar PDF:', params.data.id);
                }}
                title="Descargar PDF"
              >
                <FaFilePdf />
                PDF
              </ButtonBase>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <div style={{ height: 500, width: "100%" }}>
        <TableBase
          ref={gridRef}
          rowData={response}
          columnDefs={columnDefs}
          loading={isLoading}
          pagination={true}
          paginationPageSize={20}
          tableKey="mis-facturas"
          persistColumnState={true}
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
