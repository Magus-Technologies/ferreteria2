"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { App, DatePicker, Input } from "antd";
const { RangePicker } = DatePicker;
import dayjs from "dayjs";
import { DollarOutlined } from "@ant-design/icons";
import {
  trasladoBovedaApi,
  type TrasladoBoveda,
} from "../../../../../../lib/api/traslado-boveda";
import TableWithTitle from "~/components/tables/table-with-title";
import { AgGridReact } from "ag-grid-react";
import { useColumnsHistorialTraslados } from "~/app/ui/facturacion-electronica/gestion-cajas/_components/columns-historial-traslados";

interface HistorialTrasladosBovedaProps {
  aperturaCierreId: string;
  onTrasladoAnulado?: () => void;
}

export default function HistorialTrasladosBoveda({
  aperturaCierreId,
  onTrasladoAnulado,
}: HistorialTrasladosBovedaProps) {
  const { modal, message } = App.useApp();
  const [traslados, setTraslados] = useState<TrasladoBoveda[]>([]);
  const [loading, setLoading] = useState(false);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()]);
  const [buscarUsuario, setBuscarUsuario] = useState("")
  const gridRef = useRef<AgGridReact<TrasladoBoveda>>(null);

  const cargarTraslados = async () => {
    try {
      setLoading(true);
      const response = await trasladoBovedaApi.obtenerTrasladosPorCaja(aperturaCierreId);
      setTraslados(Array.isArray(response) ? response : (response as any)?.data || []);
    } catch (error) {
      message.error("Error al cargar traslados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aperturaCierreId) {
      cargarTraslados();
    }
  }, [aperturaCierreId]);

  const handleAnular = async (traslado: TrasladoBoveda) => {
    modal.confirm({
      title: "¿Anular traslado a bóveda?",
      content: (
        <div>
          <p>¿Estás seguro de que deseas anular este traslado?</p>
          <p className="mt-2 text-sm text-slate-600">
            Monto: <span className="font-semibold">S/ {parseFloat(traslado.monto).toFixed(2)}</span>
          </p>
        </div>
      ),
      okText: "Continuar",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await trasladoBovedaApi.anularTraslado(traslado.id, {
            supervisor_id: '',
            supervisor_password: '',
          });
          message.success("Traslado anulado exitosamente");
          cargarTraslados();
          onTrasladoAnulado?.();
        } catch (error: any) {
          message.error(
            error.response?.data?.message || "Error al anular traslado"
          );
        }
      },
    });
  };

  const columns = useColumnsHistorialTraslados({
    onAnular: handleAnular,
  });

  const filteredTraslados = useMemo(() => {
    const texto = buscarUsuario.trim().toLowerCase();
    return traslados.filter(t => {
      if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
        const fecha = dayjs(t.fecha_traslado);
        const [start, end] = rangoFechas;
        const dentroRango =
          (fecha.isAfter(start, 'day') || fecha.isSame(start, 'day')) &&
          (fecha.isBefore(end, 'day') || fecha.isSame(end, 'day'));
        if (!dentroRango) return false;
      }
      const nombreVendedor = (t.vendedor?.name ?? t.vendedor_id ?? '').toLowerCase()
      if (texto && !nombreVendedor.includes(texto)) {
        return false;
      }
      return true;
    });
  }, [traslados, rangoFechas, buscarUsuario]);

  const totalTrasladado = filteredTraslados.reduce(
    (sum, t) => sum + parseFloat(t.monto),
    0
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">Buscar usuario:</span>
            <Input.Search
              className="w-56"
              placeholder="Nombre del vendedor"
              value={buscarUsuario}
              onChange={(e) => setBuscarUsuario(e.target.value)}
              allowClear
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">Rango de fechas:</span>
            <RangePicker
              className="w-64"
              placeholder={['Inicio', 'Fin']}
              value={rangoFechas}
              onChange={(val) => setRangoFechas(val as any)}
              allowClear
            />
          </div>
        </div>

        <div className="p-2 px-4 bg-amber-50 border border-amber-200 rounded-lg inline-block text-right">
          <div className="flex items-center gap-4 justify-end">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Total Trasladado:
            </span>
            <span className="text-lg font-bold text-amber-600">
              <DollarOutlined className="mr-1" />
              S/ {totalTrasladado.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-none mt-1">
            {filteredTraslados.length} traslado{filteredTraslados.length !== 1 ? "s" : ""}{" "}
            filtrado{filteredTraslados.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="h-[440px] w-full">
        <TableWithTitle<TrasladoBoveda>
          id="historial-traslados-boveda-modal"
          title="Historial de Traslados a Bóveda"
          tableRef={gridRef}
          rowData={filteredTraslados}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
          headerColor="var(--color-amber-600)"
          loading={loading}
          suppressDragLeaveHidesColumns={true}
          suppressMovableColumns={true}
        />
      </div>
    </div>
  );
}
