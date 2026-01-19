"use client";

import { useState, useEffect, useRef } from "react";
import { Spin } from "antd";
import { cajaApi, type AperturaYCierreCaja } from "~/lib/api/caja";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsAperturas } from "./columns-aperturas";

export default function HistorialAperturas() {
  const [loading, setLoading] = useState(true);
  const [aperturas, setAperturas] = useState<AperturaYCierreCaja[]>([]);
  const gridRef = useRef<AgGridReact<AperturaYCierreCaja>>(null);

  const fetchAperturas = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando historial de aperturas...');
      
      // Usar historialTodas() para ver todas las aperturas (admin)
      // O usar historial() para ver solo las del usuario actual
      const response = await cajaApi.historialTodas({
        page: 1,
        per_page: 100,
      });

      console.log('📦 Respuesta del backend:', response);

      if (response.error) {
        console.error("❌ Error al cargar aperturas:", response.error);
        setAperturas([]);
        return;
      }

      if (response.data) {
        console.log('✅ Aperturas recibidas:', response.data.data);
        console.log('📊 Total de aperturas:', response.data.pagination?.total);
        setAperturas(response.data.data || []);
      }
    } catch (error) {
      console.error("❌ Error al cargar aperturas:", error);
      setAperturas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAperturas();
  }, []);

  const columns = useColumnsAperturas();

  if (loading) {
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
