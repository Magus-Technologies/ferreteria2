import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Spin, Button, Tooltip, Modal, Descriptions, message } from "antd";
import CardDashboard from "~/app/_components/cards/card-dashboard";
import { FaMoneyBillWave, FaClock, FaCheckCircle, FaHistory, FaCalendarCheck, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { deudaPersonalApi, type DeudaPersonal } from "~/lib/api/deuda-personal";
import { useRef, useState } from "react";

interface AbonoDeuda {
  id: number;
  deuda_personal_id: number;
  monto: string | number;
  metodo_pago_id: number | null;
  numero_operacion: string | null;
  observaciones: string | null;
  saldo_anterior: string | number;
  saldo_despues: string | number;
  fecha_abono: string;
  registrado_por_user_id: string;
  created_at: string;
  updated_at: string;
  metodo_pago?: {
    id: number;
    name: string;
  } | null;
  registrado_por?: {
    id: string;
    name: string;
  };
}

interface HistorialAbonosProps {
  deuda: DeudaPersonal;
  onEditarAbono: (abono: AbonoDeuda) => void;
}

export function HistorialAbonos({ deuda, onEditarAbono }: HistorialAbonosProps) {
  const gridRef = useRef<AgGridReact<AbonoDeuda>>(null);
  const queryClient = useQueryClient();
  const [selectedAbono, setSelectedAbono] = useState<AbonoDeuda | null>(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  
  const { data: historial, isLoading, refetch } = useQuery({
    queryKey: ["historial-abonos", deuda.id],
    queryFn: async () => {
      const response = await deudaPersonalApi.getHistorialAbonos(deuda.id);
      console.log('📊 Historial de abonos recibido:', response);
      return response;
    },
  });

  const abonos = historial || [];

  const handleVerDetalle = (abono: AbonoDeuda) => {
    setSelectedAbono(abono);
    setModalDetalleVisible(true);
  };

  const handleEditar = (abono: AbonoDeuda) => {
    onEditarAbono(abono);
  };

  const handleEliminar = (abono: AbonoDeuda) => {
    Modal.confirm({
      title: '¿Eliminar este abono?',
      content: `Se eliminará el abono de S/ ${parseFloat(String(abono.monto)).toFixed(2)} y se recalcularán los saldos.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const response = await deudaPersonalApi.eliminarAbono(abono.id) as any;
          if (response.success) {
            message.success('Abono eliminado exitosamente');
            refetch();
            queryClient.invalidateQueries({ queryKey: ["resumen-deudas"] });
          } else {
            message.error(response.message || 'Error al eliminar abono');
          }
        } catch (error: any) {
          message.error(error.message || 'Error al eliminar abono');
        }
      },
    });
  };

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
      field: "metodo_pago",
      width: 150,
      cellRenderer: (params: any) => (
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold uppercase">
          {params.value?.name || "Efectivo"}
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
    {
      headerName: "Acciones",
      field: "id",
      width: 140,
      pinned: "right",
      cellRenderer: (params: any) => (
        <div className="flex gap-1 items-center justify-center">
          <Tooltip title="Ver Detalles">
            <Button
              type="link"
              size="small"
              onClick={() => handleVerDetalle(params.data)}
              className="flex items-center"
            >
              <FaEye className="text-blue-600 text-base" />
            </Button>
          </Tooltip>
          <Tooltip title="Editar Abono">
            <Button
              type="link"
              size="small"
              onClick={() => handleEditar(params.data)}
              className="flex items-center"
            >
              <FaEdit className="text-amber-600 text-base" />
            </Button>
          </Tooltip>
          <Tooltip title="Eliminar Abono">
            <Button
              type="link"
              size="small"
              onClick={() => handleEliminar(params.data)}
              className="flex items-center"
              danger
            >
              <FaTrash className="text-red-600 text-base" />
            </Button>
          </Tooltip>
        </div>
      ),
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

      {/* Modal de Detalles del Abono */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FaEye className="text-blue-600" />
            <span>Detalles del Abono</span>
          </div>
        }
        open={modalDetalleVisible}
        onCancel={() => {
          setModalDetalleVisible(false);
          setSelectedAbono(null);
        }}
        footer={null}
        width={700}
      >
        {selectedAbono && (
          <Descriptions bordered column={2} size="small" className="mt-4">
            <Descriptions.Item label="ID de Abono" span={2}>
              #{selectedAbono.id}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de Abono" span={2}>
              {dayjs(selectedAbono.fecha_abono).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="Monto Abonado">
              <span className="font-bold text-emerald-600">
                S/ {parseFloat(String(selectedAbono.monto)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Método de Pago">
              {selectedAbono.metodo_pago?.name || "Efectivo"}
            </Descriptions.Item>
            <Descriptions.Item label="Saldo Anterior">
              S/ {parseFloat(String(selectedAbono.saldo_anterior)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Descriptions.Item>
            <Descriptions.Item label="Saldo Después">
              <span className={parseFloat(String(selectedAbono.saldo_despues)) === 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                S/ {parseFloat(String(selectedAbono.saldo_despues)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Número de Operación" span={2}>
              {selectedAbono.numero_operacion || "Sin número de operación"}
            </Descriptions.Item>
            <Descriptions.Item label="Registrado Por" span={2}>
              {selectedAbono.registrado_por?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Observaciones" span={2}>
              {selectedAbono.observaciones || "Sin observaciones"}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de Registro" span={2}>
              {dayjs(selectedAbono.created_at).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
