"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal, Descriptions, Spin, Card } from "antd";
import { cajaApi, type AperturaYCierreCaja } from "~/lib/api/caja";
import { QueryKeys } from "~/app/_lib/queryKeys";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsCierres } from "./columns-cierres";
import dayjs from "dayjs";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
};

export default function HistorialCierres() {
  const [selectedCierre, setSelectedCierre] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [movimientos, setMovimientos] = useState<any>(null);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const gridRef = useRef<AgGridReact<AperturaYCierreCaja>>(null);

  const { data: cierres = [], isLoading } = useQuery({
    queryKey: [QueryKeys.HISTORIAL_APERTURAS],
    queryFn: async () => {
      const response = await cajaApi.historial({
        page: 1,
        per_page: 100,
      });

      if (response.error) {
        console.error("Error al cargar cierres:", response.error);
        return [];
      }

      if (response.data) {
        // Filtrar solo los cierres (estado cerrada)
        const cierresData = response.data.data.filter(
          (item) => item.estado === "cerrada"
        );
        return cierresData || [];
      }

      return [];
    },
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const verDetalles = async (record: AperturaYCierreCaja) => {
    setSelectedCierre(record);
    setModalVisible(true);
    setLoadingMovimientos(true);

    try {
      const response = await cajaApi.resumenMovimientos(record.id);
      if (response.error) {
        console.error("Error al cargar movimientos:", response.error);
        return;
      }
      
      if (response.data) {
        setMovimientos(response.data.data);
      }
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const columns = useColumnsCierres({
    onVerDetalles: verDetalles,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Cargando cierres..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Mis Cierres de Caja</span>
          <span className="text-sm text-slate-500">
            Total: {cierres.length} cierres
          </span>
        </div>
        <div className="h-[500px] w-full">
          <TableBase<AperturaYCierreCaja>
            ref={gridRef}
            rowData={cierres}
            columnDefs={columns}
            rowSelection={false}
            withNumberColumn={true}
            headerColor="var(--color-amber-600)"
          />
        </div>
      </div>

      <Modal
        title="Detalles del Cierre de Caja"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCierre(null);
          setMovimientos(null);
        }}
        footer={null}
        width={900}
      >
        {selectedCierre && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Caja" span={2}>
                {selectedCierre.sub_caja?.nombre} ({selectedCierre.sub_caja?.codigo})
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Apertura">
                {dayjs(selectedCierre.fecha_apertura).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Cierre">
                {dayjs(selectedCierre.fecha_cierre).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Monto Apertura">
                <span className="font-semibold text-green-600">
                  {formatCurrency(parseFloat(selectedCierre.monto_apertura))}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Monto Cierre">
                <span className="font-semibold text-blue-600">
                  {formatCurrency(parseFloat(selectedCierre.monto_cierre || "0"))}
                </span>
              </Descriptions.Item>
            </Descriptions>

            {loadingMovimientos ? (
              <div className="flex justify-center py-8">
                <Spin size="large" />
              </div>
            ) : movimientos ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-3">Totales por Método de Pago</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Efectivo:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(movimientos.totales_por_metodo?.efectivo || "0"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarjeta:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(movimientos.totales_por_metodo?.tarjeta || "0"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yape:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(movimientos.totales_por_metodo?.yape || "0"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Izipay:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(movimientos.totales_por_metodo?.izipay || "0"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transferencia:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(movimientos.totales_por_metodo?.transferencia || "0"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Otros:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(movimientos.totales_por_metodo?.otros || "0"))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card size="small" title="Ventas" className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {movimientos.ventas?.length || 0}
                    </div>
                  </Card>
                  <Card size="small" title="Ingresos" className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {movimientos.ingresos?.length || 0}
                    </div>
                  </Card>
                  <Card size="small" title="Egresos" className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {movimientos.egresos?.length || 0}
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </>
  );
}
