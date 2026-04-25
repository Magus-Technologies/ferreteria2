"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Tag, Spin, Tooltip } from "antd";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { HiDocumentText } from "react-icons/hi2";
import dynamic from "next/dynamic";
import TableWithTitle from "~/components/tables/table-with-title";
import { ventaApi, type VentaCompleta } from "~/lib/api/venta";
import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { formatFechaPeru } from "~/utils/fechas";

const ModalDocVenta = dynamic(
  () => import("~/app/ui/facturacion-electronica/mis-ventas/_components/modals/modal-doc-venta"),
  { ssr: false }
);

interface DeudaCliente {
  id: string;
  cliente_id: number;
  cliente_nombre: string;
  documento: string;
  serie_numero: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_total: number;
  monto_pagado: number;
  deuda: number;
  tipo_moneda: string;
  estado_de_cuenta: string;
}

export default function TableDeudasClientes() {
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<DeudaCliente[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const tableRef = useRef<AgGridReact<DeudaCliente>>(null);
  const pageSize = 50;

  // Estado para el modal de documento
  const [modalOpen, setModalOpen] = useState(false);
  const [ventaIdSeleccionada, setVentaIdSeleccionada] = useState<string | undefined>(undefined);

  // Query para obtener deudas con scroll infinito
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: [QueryKeys.VENTAS, "deudas", page],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar({
        per_page: pageSize,
        page,
      });
      return result.data;
    },
  });

  // Actualizar datos cuando llega nueva página
  useEffect(() => {
    if (response?.data) {
      const transformedData: DeudaCliente[] = response.data.map((venta: VentaCompleta) => {
        const monto_total = venta.comprobante_electronico?.total || 0;
        const monto_pagado = venta.total_cobrado || 0;
        const deuda = monto_total - monto_pagado;

        return {
          id: venta.id,
          cliente_id: venta.cliente_id || 0,
          cliente_nombre: venta.cliente?.razon_social || venta.cliente?.nombres || "Cliente Varios",
          documento: `${venta.tipo_documento}`,
          serie_numero: `${venta.serie}-${venta.numero}`,
          fecha_emision: venta.fecha,
          fecha_vencimiento: venta.fecha_vencimiento || venta.fecha,
          monto_total,
          monto_pagado,
          deuda,
          tipo_moneda: venta.tipo_moneda,
          estado_de_cuenta: "Crédito",
        };
      });

      if (page === 1) {
        setAllData(transformedData);
      } else {
        setAllData((prev) => [...prev, ...transformedData]);
      }
      setHasMore(page < (response.last_page || 1));
    }
  }, [response, page]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  }, [hasMore, isFetching]);

  const handleViewDoc = useCallback((deuda: DeudaCliente) => {
    setVentaIdSeleccionada(deuda.id);
    setModalOpen(true);
  }, []);

  const columnDefs: ColDef<DeudaCliente>[] = [
    {
      headerName: "Cliente",
      field: "cliente_nombre",
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: "Documento",
      field: "serie_numero",
      width: 130,
      minWidth: 130,
    },
    {
      headerName: "Fecha Emisión",
      field: "fecha_emision",
      width: 140,
      minWidth: 140,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, "DD/MM/YYYY") : "-",
    },
    {
      headerName: "Fecha Vencimiento",
      field: "fecha_vencimiento",
      width: 150,
      minWidth: 150,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, "DD/MM/YYYY") : "-",
    },
    {
      headerName: "Monto Total",
      field: "monto_total",
      width: 120,
      minWidth: 120,
      type: "numericColumn",
      cellRenderer: (params: any) => {
        const monto = Number(params.value || 0);
        const moneda = params.data?.tipo_moneda === "d" ? "$" : "S/.";
        return `${moneda} ${monto.toFixed(2)}`;
      },
    },
    {
      headerName: "Pagado",
      field: "monto_pagado",
      width: 120,
      minWidth: 120,
      type: "numericColumn",
      cellRenderer: (params: any) => {
        const monto = Number(params.value || 0);
        const moneda = params.data?.tipo_moneda === "d" ? "$" : "S/.";
        return `${moneda} ${monto.toFixed(2)}`;
      },
    },
    {
      headerName: "Deuda",
      field: "deuda",
      width: 120,
      minWidth: 120,
      type: "numericColumn",
      cellStyle: { color: "#dc2626", fontWeight: "bold" },
      cellRenderer: (params: any) => {
        const monto = Number(params.value || 0);
        const moneda = params.data?.tipo_moneda === "d" ? "$" : "S/.";
        return `${moneda} ${monto.toFixed(2)}`;
      },
    },
    {
      headerName: "Estado",
      field: "estado_de_cuenta",
      width: 100,
      minWidth: 100,
      cellRenderer: () => (
        <Tag color="red">Crédito</Tag>
      ),
    },
    {
      headerName: "Acciones",
      field: "id",
      width: 80,
      minWidth: 80,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full">
          <Tooltip title="Ver Documento">
            <HiDocumentText
              onClick={() => handleViewDoc(params.data)}
              className="cursor-pointer hover:scale-110 transition-all text-amber-600"
              size={18}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex-1 min-h-0 relative">
        <TableWithTitle<DeudaCliente>
          id="deudas-clientes"
          title="DOCUMENTOS CON DEUDA"
          loading={isLoading}
          columnDefs={columnDefs}
          rowData={allData}
          tableRef={tableRef}
          domLayout="normal"
          selectionColor="text-red-600"
          onSelectionChanged={() => {}}
          onRowClicked={() => {}}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          getRowId={(params) => params.data.id}
          className="h-full"
          exportExcel={true}
          exportPdf={true}
          selectColumns={true}
          pagination={false}
          suppressPaginationPanel={true}
          onGridReady={(params) => {
            // Configurar scroll infinito
            params.api.onFilterChanged();
          }}
        />
        
        {/* Indicador de carga para scroll infinito */}
        {isFetching && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center py-2 bg-white border-t">
            <Spin size="small" />
          </div>
        )}
      </div>

      {/* Botón para cargar más */}
      {hasMore && !isLoading && (
        <div className="flex justify-center py-2">
          <button
            onClick={handleLoadMore}
            disabled={isFetching}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50"
          >
            {isFetching ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      )}

      {!hasMore && allData.length > 0 && (
        <div className="text-center text-sm text-gray-500 py-2">
          No hay más registros
        </div>
      )}

      {allData.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-gray-500">
          No hay documentos con deuda
        </div>
      )}

      {/* Modal para ver documento - renderizado dinámicamente en cliente */}
      {typeof window !== "undefined" && (
        <ModalDocVenta
          open={modalOpen}
          setOpen={setModalOpen}
          ventaId={ventaIdSeleccionada}
        />
      )}
    </div>
  );
}
