import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import CardDashboard from "~/app/_components/cards/card-dashboard";
import { FaHashtag, FaMoneyBillWave, FaClock, FaCheckCircle, FaHistory, FaCalendarCheck } from "react-icons/fa";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { deudaPersonalApi, type DeudaPersonal } from "~/lib/api/deuda-personal";
import { useRef } from "react";

interface AbonoDeuda {
  id: number;
  deuda_personal_id: number;
  monto: number;
  metodo_pago_id: number;
  numero_operacion: string | null;
  observaciones: string | null;
  saldo_anterior: number;
  saldo_despues: number;
  fecha_abono: string;
  registrado_por_id: string;
  created_at: string;
  updated_at: string;
  metodo_pago?: {
    id: number;
    nombre: string;
  };
  registrado_por?: {
    id: string;
    name: string;
  };
}

interface HistorialAbonosProps {
  deuda: DeudaPersonal;
}

export function HistorialAbonos({ deuda }: HistorialAbonosProps) {
  const gridRef = useRef<AgGridReact<AbonoDeuda>>(null);
  const { data: historial, isLoading } = useQuery({
    queryKey: ["historial-abonos", deuda.id],
    queryFn: async () => {
      const response = await deudaPersonalApi.getHistorialAbonos(deuda.id);
      return response.data;
    },
  });

  const abonos = historial || [];

  const columns: ColDef<AbonoDeuda>[] = [
    {
      headerName: "Fecha de Abono",
      field: "fecha_abono",
      width: 170,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <FaCalendarCheck className="text-slate-400" />
          <span className="font-medium">
            {params.value ? dayjs(params.value).format("DD/MM/YYYY HH:mm") : "-"}
          </span>
        </div>
      ),
    },
    {
      headerName: "Monto Abonado",
      field: "monto",
      width: 150,
      cellClass: "font-bold text-emerald-600",
      valueFormatter: (params) => `S/ ${parseFloat(params.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    },
    {
      headerName: "Método de Pago",
      field: "metodo_pago.nombre",
      width: 150,
      cellRenderer: (params: any) => (
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold uppercase">
          {params.value || "-"}
        </span>
      ),
    },
    {
      headerName: "Referencia/OP",
      field: "numero_operacion",
      width: 150,
      cellRenderer: (params: any) => (
        <span className="text-slate-500 font-mono text-xs">
          {params.value || "S/N"}
        </span>
      ),
    },
    {
      headerName: "Saldo Posterior",
      field: "saldo_despues",
      width: 140,
      cellRenderer: (params: any) => {
        const value = parseFloat(params.value);
        return (
          <div className={`font-bold ${value === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            S/ {value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
        );
      },
    },
    {
      headerName: "Registrado Por",
      field: "registrado_por.name",
      width: 160,
      cellRenderer: (params: any) => (
        <div className="text-xs font-medium text-slate-600">
          {params.value || "-"}
        </div>
      ),
    },
    {
      headerName: "Observaciones",
      field: "observaciones",
      flex: 1,
      minWidth: 200,
      cellClass: "text-slate-500 italic text-xs",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spin size="large" tip="Cargando historial..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CardDashboard
          title="Cant. Abonos"
          value={abonos.length}
          decimal={0}
          icon={<FaHistory className="text-blue-500" size={18} />}
        />
        <CardDashboard
          title="Total Abonado"
          value={deuda.monto_abonado}
          prefix="S/ "
          icon={<FaCheckCircle className="text-emerald-500" size={18} />}
        />
        <CardDashboard
          title="Monto Original"
          value={deuda.monto_original}
          prefix="S/ "
          icon={<FaMoneyBillWave className="text-slate-500" size={18} />}
        />
        <CardDashboard
          title="Saldo Restante"
          value={deuda.saldo_pendiente}
          prefix="S/ "
          icon={<FaClock className={deuda.saldo_pendiente === 0 ? "text-emerald-500" : "text-amber-500"} size={18} />}
        />
      </div>

      {/* Tabla de Historial */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <FaHistory className="text-slate-400" />
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Línea de Tiempo de Pagos</span>
        </div>

        <div className="h-[400px] w-full">
          <TableBase<AbonoDeuda>
            ref={gridRef}
            rowData={abonos}
            columnDefs={columns}
            rowSelection={false}
            withNumberColumn={true}
            headerColor="var(--color-amber-600)"
          />
        </div>
      </div>
    </div>
  );
}
