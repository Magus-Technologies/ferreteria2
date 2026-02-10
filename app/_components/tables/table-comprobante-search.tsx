"use client";

import { useQuery } from "@tanstack/react-query";
import { RefObject, forwardRef, useImperativeHandle, useRef } from "react";
import { facturacionElectronicaApi, type ComprobanteElectronico } from "~/lib/api/facturacion-electronica";
import TableWithTitle from "~/components/tables/table-with-title";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { Tag } from "antd";

export interface RefTableComprobanteSearchProps {
  handleRefetch: () => void;
}

interface TableComprobanteSearchProps {
  value: string;
  onRowClicked?: ({ data }: { data: ComprobanteElectronico | undefined }) => void;
  onRowDoubleClicked?: ({ data }: { data: ComprobanteElectronico | undefined }) => void;
  tipoDocumento?: "01" | "03";
  ref?: RefObject<RefTableComprobanteSearchProps | null>;
  isVisible?: boolean;
}

const TableComprobanteSearch = forwardRef<RefTableComprobanteSearchProps, TableComprobanteSearchProps>(
  ({ value, onRowClicked, onRowDoubleClicked, tipoDocumento, isVisible }, ref) => {
    const tableGridRef = useRef<any>(null);

    const { data, isLoading, refetch } = useQuery({
      queryKey: ["comprobantes-search", value, tipoDocumento],
      queryFn: async () => {
        if (!value || value.length < 1) {
          return [];
        }

        const response = await facturacionElectronicaApi.buscarComprobantes({
          query: value,
          tipo: tipoDocumento,
          limit: 50,
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.data?.data || [];
      },
      enabled: isVisible && value.length >= 1,
      staleTime: 1000 * 30,
    });

    useImperativeHandle(ref, () => ({
      handleRefetch: () => {
        refetch();
      },
    }));

    const columnDefs: ColDef<ComprobanteElectronico>[] = [
      {
        headerName: "#",
        valueGetter: "node.rowIndex + 1",
        width: 60,
        cellStyle: { textAlign: "center", fontWeight: "500" },
      },
      {
        headerName: "Tipo",
        field: "tipo_comprobante",
        width: 110,
        cellRenderer: (params: any) => {
          const tipo = params.value;
          return (
            <div className="flex items-center h-full">
              <Tag color={tipo === "01" ? "blue" : "green"} className="font-medium">
                {tipo === "01" ? "FACTURA" : "BOLETA"}
              </Tag>
            </div>
          );
        },
      },
      {
        headerName: "Serie",
        field: "serie",
        width: 90,
        cellStyle: { fontWeight: "600" },
      },
      {
        headerName: "Número",
        width: 100,
        cellStyle: { fontWeight: "600" },
        valueGetter: (params) => params.data?.correlativo || "",
      },
      {
        headerName: "Fecha",
        field: "fecha_emision",
        width: 120,
        valueFormatter: (params) => {
          return params.value ? dayjs(params.value).format("DD/MM/YYYY") : "";
        },
      },
      {
        headerName: "Cliente",
        field: "cliente",
        flex: 1,
        minWidth: 280,
        valueGetter: (params) => {
          const cliente = params.data?.cliente;
          if (!cliente) return "Sin cliente";
          
          if (cliente.razon_social) {
            return cliente.razon_social;
          }
          
          const nombres = cliente.nombres || "";
          const apellidos = cliente.apellidos || "";
          return `${nombres} ${apellidos}`.trim() || "Sin cliente";
        },
        cellRenderer: (params: any) => {
          const cliente = params.data?.cliente;
          let nombre = "Sin cliente";
          
          if (cliente) {
            if (cliente.razon_social) {
              nombre = cliente.razon_social;
            } else {
              const nombres = cliente.nombres || "";
              const apellidos = cliente.apellidos || "";
              nombre = `${nombres} ${apellidos}`.trim() || "Sin cliente";
            }
          }
          
          return (
            <div className="flex flex-col justify-center h-full py-1">
              <div className="font-medium text-sm">{nombre}</div>
              <div className="text-xs text-gray-500">{cliente?.numero_documento || ""}</div>
            </div>
          );
        },
      },
      {
        headerName: "Total",
        field: "total",
        width: 130,
        cellStyle: { textAlign: "right", fontWeight: "bold" },
        valueFormatter: (params) => {
          // Usar 'moneda' en lugar de 'tipo_moneda'
          const monedaCodigo = params.data?.moneda || params.data?.tipo_moneda || "PEN";
          const simbolo = monedaCodigo === "USD" ? "$" : "S/";
          const valor = parseFloat(params.value) || 0;
          return `${simbolo} ${valor.toFixed(2)}`;
        },
      },
      {
        headerName: "Estado",
        field: "estado_sunat",
        width: 140,
        cellRenderer: (params: any) => {
          const estado = params.value;
          return (
            <div className="flex items-center h-full">
              <Tag color={estado === "ACEPTADO" ? "success" : "warning"}>
                {estado}
              </Tag>
            </div>
          );
        },
      },
    ];

    return (
      <TableWithTitle<ComprobanteElectronico>
        tableRef={tableGridRef}
        id="f-e.table-comprobante-search"
        title="Comprobantes"
        columnDefs={columnDefs}
        rowData={data || []}
        loading={isLoading}
        onRowClicked={onRowClicked}
        onRowDoubleClicked={onRowDoubleClicked}
        rowSelection={false}
        pagination={false}
        domLayout="normal"
        getRowHeight={() => 55}
      />
    );
  }
);

TableComprobanteSearch.displayName = "TableComprobanteSearch";

export default TableComprobanteSearch;
