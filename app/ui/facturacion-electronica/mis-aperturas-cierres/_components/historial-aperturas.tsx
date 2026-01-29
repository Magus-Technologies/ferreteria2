"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { cajaApi, type AperturaYCierreCaja } from "~/lib/api/caja";
import { QueryKeys } from "~/app/_lib/queryKeys";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsAperturas } from "./columns-aperturas";

export default function HistorialAperturas() {
  const gridRef = useRef<AgGridReact<AperturaYCierreCaja>>(null);

  const { data: aperturas = [], isLoading } = useQuery({
    queryKey: [QueryKeys.HISTORIAL_APERTURAS_TODAS],
    queryFn: async () => {
      console.log('🔍 Cargando historial de aperturas...');
      
      const response = await cajaApi.historialTodas({
        page: 1,
        per_page: 100,
      });

      console.log('📦 Respuesta del backend:', response);

      if (response.error) {
        console.error("❌ Error al cargar aperturas:", response.error);
        return [];
      }

      if (response.data) {
        console.log('✅ Aperturas recibidas:', response.data.data);
        console.log('📊 Total de aperturas:', response.data.pagination?.total);
        return response.data.data || [];
      }

      return [];
    },
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
    staleTime: 30000, // Los datos se consideran frescos por 30 segundos
  });

  const columns = useColumnsAperturas();

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Cargando aperturas..." />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">Mis Aperturas de Caja</span>
        <span className="text-sm text-slate-500">
          Total: {aperturas.length} aperturas
        </span>
      </div>
      <div className="h-[500px] w-full">
        <TableBase<AperturaYCierreCaja>
          ref={gridRef}
          rowData={aperturas}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
          headerColor="var(--color-amber-600)"
        />
      </div>
    </div>
  );
}
