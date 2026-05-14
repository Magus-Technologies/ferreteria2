"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Tag, Spin, Tooltip } from "antd";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { HiDocumentText } from "react-icons/hi2";
import { FaEye, FaExclamationTriangle } from "react-icons/fa";
import dynamic from "next/dynamic";
import TableWithTitle from "~/components/tables/table-with-title";
import ModalDetalleDeudaCliente, { type DeudaClienteDetalle } from "../modals/modal-detalle-deuda-cliente";
import { ventaApi, type VentaCompleta } from "~/lib/api/venta";
import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { formatFechaPeru } from "~/utils/fechas";
import { useStoreClienteSeleccionado } from "../../_store/store-cliente-seleccionado";
import { orangeColors } from "~/lib/colors";

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
  const { clienteId } = useStoreClienteSeleccionado();
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<DeudaCliente[]>([]);
  const tableRef = useRef<AgGridReact<DeudaCliente>>(null);
  const pageSize = 50;

  // Estado para el modal de documento
  const [modalOpen, setModalOpen] = useState(false);
  const [ventaIdSeleccionada, setVentaIdSeleccionada] = useState<string | undefined>(undefined);

  // Estado para el modal de detalle de deuda
  const [modalDeudaOpen, setModalDeudaOpen] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<DeudaClienteDetalle | null>(null);

  // Query para obtener deudas con scroll infinito
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: [QueryKeys.VENTAS, "deudas", page, clienteId],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar({
        per_page: pageSize,
        page,
        cliente_id: clienteId || undefined,
      });
      return result.data;
    },
  });

  // Resetear página cuando cambia el cliente seleccionado
  useEffect(() => {
    setPage(1);
    setAllData([]);
  }, [clienteId]);

  // Actualizar datos cuando llega nueva página
  useEffect(() => {
    if (response) {
      const dataArray = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (response as any)?.data?.data || [])
      const transformedData: DeudaCliente[] = dataArray.map((venta: VentaCompleta) => {
        // Calcular total sumando productos (igual que ventas-por-cobrar)
        const monto_total = (venta.productos_por_almacen || []).reduce((acc: number, item: any) => {
          for (const u of item.unidades_derivadas ?? []) {
            const precio = Number(u.precio ?? 0)
            const cantidad = Number(u.cantidad ?? 0)
            const descuento = Number(u.descuento ?? 0)
            const bonificacion = Boolean(u.bonificacion)
            acc += bonificacion ? 0 : (precio * cantidad) - descuento
          }
          return acc
        }, 0)
        const monto_pagado = Number(venta.total_cobrado) || 0;
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
    }
  }, [response, page]);

  const totalDeuda = allData.reduce((sum, item) => sum + item.deuda, 0)
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const isVencida = (fecha?: string) => {
    if (!fecha) return false;
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return false;
    f.setHours(0, 0, 0, 0);
    return f.getTime() < hoyInicio.getTime();
  };
  const tituloExtra = (
    <div className="flex items-center gap-3">
      <Tag color="blue">{allData.length} documentos</Tag>
      <span className="text-sm font-bold text-red-600">
        Total deuda: S/. {totalDeuda.toFixed(2)}
      </span>
    </div>
  );

  const handleViewDoc = useCallback((deuda: DeudaCliente) => {
    setVentaIdSeleccionada(deuda.id);
    setModalOpen(true);
  }, []);

  const columnDefs: ColDef<DeudaCliente>[] = [
    {
      colId: "cliente_nombre",
      headerName: "Cliente",
      field: "cliente_nombre",
      flex: 1,
      minWidth: 200,
    },
    {
      colId: "serie_numero",
      headerName: "Documento",
      field: "serie_numero",
      width: 130,
      minWidth: 130,
    },
    {
      colId: "fecha_emision",
      headerName: "Fecha Emisión",
      field: "fecha_emision",
      width: 140,
      minWidth: 140,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, "DD/MM/YYYY") : "-",
    },
    {
      colId: "fecha_vencimiento",
      headerName: "Fecha Vencimiento",
      field: "fecha_vencimiento",
      width: 150,
      minWidth: 150,
      cellRenderer: (params: any) => {
        if (!params.value) return <span className="text-gray-400">-</span>;
        const vencido = isVencida(params.value);
        return (
          <span
            className={
              vencido
                ? "text-red-600 font-semibold flex items-center gap-1"
                : ""
            }
          >
            {vencido && <FaExclamationTriangle size={12} />}
            {formatFechaPeru(params.value, "DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      colId: "monto_total",
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
      colId: "monto_pagado",
      headerName: "Pagado",
      field: "monto_pagado",
      width: 120,
      minWidth: 120,
      type: "numericColumn",
      cellStyle: { color: "#16a34a", fontWeight: "bold" },
      cellRenderer: (params: any) => {
        const monto = Number(params.value || 0);
        const moneda = params.data?.tipo_moneda === "d" ? "$" : "S/.";
        return `${moneda} ${monto.toFixed(2)}`;
      },
    },
    {
      colId: "deuda",
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
      colId: "estado_de_cuenta",
      headerName: "Estado",
      field: "estado_de_cuenta",
      width: 100,
      minWidth: 100,
      cellRenderer: () => (
        <Tag color="red">Crédito</Tag>
      ),
    },
    {
      colId: "acciones",
      headerName: "Acciones",
      field: "id",
      width: 100,
      minWidth: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-2 h-full">
          <Tooltip title="Ver Documento">
            <HiDocumentText
              onClick={() => handleViewDoc(params.data)}
              className="cursor-pointer hover:scale-110 transition-all text-amber-600"
              size={18}
            />
          </Tooltip>
          <Tooltip title="Ver detalle de deuda">
            <FaEye
              onClick={() => { setDeudaSeleccionada(params.data); setModalDeudaOpen(true) }}
              className="cursor-pointer hover:scale-110 transition-all text-blue-600"
              size={15}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-2 h-full w-full">
      <div className="flex-1 min-h-0 relative w-full">
        <TableWithTitle<DeudaCliente>
          id="deudas-clientes"
          title="DOCUMENTOS CON DEUDA"
          extraTitle={tituloExtra}
          loading={isLoading || isFetching}
          columnDefs={columnDefs}
          rowData={allData}
          tableRef={tableRef}
          domLayout="normal"
          selectionColor={orangeColors[10]}
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



      {/* Modal para ver documento - renderizado dinámicamente en cliente */}
      {typeof window !== "undefined" && (
        <ModalDocVenta
          open={modalOpen}
          setOpen={setModalOpen}
          ventaId={ventaIdSeleccionada}
        />
      )}

      <ModalDetalleDeudaCliente
        open={modalDeudaOpen}
        setOpen={setModalDeudaOpen}
        deuda={deudaSeleccionada}
      />
    </div>
  );
}
