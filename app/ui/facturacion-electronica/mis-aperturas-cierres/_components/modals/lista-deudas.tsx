import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, Spin, Empty, DatePicker } from "antd";
import { deudaPersonalApi, type DeudaPersonal } from "~/lib/api/deuda-personal";
import { CardDeuda } from "./card-deuda";
import CardDashboard from "~/app/_components/cards/card-dashboard";
import { FaExclamationTriangle, FaCheckCircle, FaMoneyBillWave, FaFilter, FaCalendarAlt, FaChartPie } from "react-icons/fa";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

interface ListaDeudasProps {
  onSelectDeuda: (deuda: DeudaPersonal) => void;
  userId?: string;
}

export function ListaDeudas({ onSelectDeuda, userId }: ListaDeudasProps) {
  const [estadoFilter, setEstadoFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data: resumen, isLoading } = useQuery({
    queryKey: ["resumen-deudas", userId],
    queryFn: async () => {
      const data = await deudaPersonalApi.getResumen(userId);
      return data;
    },
  });

  // Filtrar deudas
  const deudasFiltradas = (resumen?.deudas || []).filter((deuda: DeudaPersonal) => {
    if (estadoFilter && deuda.estado !== estadoFilter) return false;

    if (dateRange && dateRange[0] && dateRange[1]) {
      const fechaCierre = deuda.arqueo_diario?.apertura_cierre_caja?.fecha_cierre;
      if (!fechaCierre) return true;

      const fechaCierreDay = dayjs(fechaCierre);
      if (!fechaCierreDay.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
        return false;
      }
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spin size="large" tip="Cargando deudas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CardDashboard
          title="Total Adeudado"
          value={resumen?.monto_total_original || 0}
          prefix="S/ "
          icon={<FaExclamationTriangle className="text-rose-500" size={18} />}
        />

        <CardDashboard
          title="Total Abonado"
          value={resumen?.monto_total_abonado || 0}
          prefix="S/ "
          icon={<FaCheckCircle className="text-emerald-500" size={18} />}
        />

        <CardDashboard
          title="Saldo Pendiente"
          value={resumen?.saldo_total_pendiente || 0}
          prefix="S/ "
          icon={<FaMoneyBillWave className="text-amber-500" size={18} />}
        />

        <CardDashboard
          title="Deudas Activas"
          value={
            (resumen?.deudas_pendientes || 0) +
            (resumen?.deudas_parciales || 0)
          }
          decimal={0}
          icon={<FaChartPie className="text-blue-500" size={18} />}
        />
      </div>

      {/* Filtros */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <FaFilter />
          <span>Filtros:</span>
        </div>

        <Select
          placeholder="Estado de deuda"
          className="w-56"
          variant="filled"
          allowClear
          value={estadoFilter}
          onChange={setEstadoFilter}
        >
          <Select.Option value="pendiente">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              Pendiente
            </span>
          </Select.Option>
          <Select.Option value="parcialmente_pagada">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Parcialmente Pagada
            </span>
          </Select.Option>
          <Select.Option value="pagada">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Pagada
            </span>
          </Select.Option>
        </Select>

        <RangePicker
          placeholder={["Fecha Inicio", "Fecha Fin"]}
          className="w-80"
          variant="filled"
          value={dateRange}
          onChange={(dates) => setDateRange(dates as any)}
          suffixIcon={<FaCalendarAlt className="text-slate-400" />}
        />

        <div className="ml-auto text-xs text-slate-400 flex items-center gap-2">
          Mostrando <span className="font-bold text-slate-600">{deudasFiltradas.length}</span> resultados
        </div>
      </div>

      {/* Lista de Deudas */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 scrollbar-thin">
        {deudasFiltradas.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1">
                <div className="text-slate-500 font-medium">No se encontraron resultados</div>
                <div className="text-slate-400 text-xs">
                  {estadoFilter || dateRange
                    ? "Prueba ajustando los filtros de búsqueda"
                    : "¡Hecho! No hay registros pendientes en esta sección"}
                </div>
              </div>
            }
            className="py-12 bg-white rounded-2xl border border-dashed border-slate-200"
          />
        ) : (
          deudasFiltradas.map((deuda: DeudaPersonal) => (
            <CardDeuda
              key={deuda.id}
              deuda={deuda}
              onSelect={() => onSelectDeuda(deuda)}
            />
          ))
        )}
      </div>
    </div>
  );
}
