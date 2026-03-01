import { useState, useMemo } from "react";
import { Modal, Tabs, Tooltip } from "antd";
import type { TabsProps } from "antd";
import { FaMoneyBillWave, FaList, FaHistory, FaInfoCircle, FaCoins, FaHandHoldingUsd } from "react-icons/fa";
import { ListaDeudas } from "./lista-deudas";
import { FormRegistrarAbono } from "./form-registrar-abono";
import { HistorialAbonos } from "./historial-abonos";
import type { DeudaPersonal } from "~/lib/api/deuda-personal";
import { cn } from "~/lib/utils";

interface ModalGestionDeudasProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export default function ModalGestionDeudas({
  open,
  onClose,
  userId,
}: ModalGestionDeudasProps) {
  const [activeTab, setActiveTab] = useState("lista");
  const [selectedDeuda, setSelectedDeuda] = useState<DeudaPersonal | null>(
    null
  );
  const [abonoToEdit, setAbonoToEdit] = useState<any>(null);

  const handleSelectDeuda = (deuda: DeudaPersonal) => {
    setSelectedDeuda(deuda);
    setAbonoToEdit(null); // Limpiar abono a editar
    // Si la deuda está pagada, ir directo al historial
    if (deuda.estado === 'pagada') {
      setActiveTab("historial");
    } else {
      setActiveTab("abono");
    }
  };

  const handleEditarAbono = (abono: any) => {
    setAbonoToEdit(abono);
    setActiveTab("abono");
  };

  const handleAbonoSuccess = () => {
    setAbonoToEdit(null); // Limpiar modo edición
    // Cambiar a la pestaña de historial después de registrar el abono
    setActiveTab("historial");
  };

  const tabItems: TabsProps['items'] = useMemo(
    () => [
      {
        key: "lista",
        label: (
          <span className="flex items-center gap-2 px-2">
            <FaList className="text-sm" />
            Catálogo de Deudas
          </span>
        ),
        children: (
          <div className="pt-2 animate-in fade-in duration-500">
            <ListaDeudas onSelectDeuda={handleSelectDeuda} userId={userId} />
          </div>
        ),
      },
      {
        key: "abono",
        label: (
          <span className="flex items-center gap-2 px-2">
            <FaHandHoldingUsd className="text-sm" />
            {abonoToEdit ? 'Editar Abono' : 'Registrar Abono'}
          </span>
        ),
        disabled: !selectedDeuda || (selectedDeuda.estado === 'pagada' && !abonoToEdit),
        children: selectedDeuda ? (
          <div className="pt-2 animate-in slide-in-from-right-4 duration-500">
            <FormRegistrarAbono
              deuda={selectedDeuda}
              onSuccess={handleAbonoSuccess}
              abonoToEdit={abonoToEdit}
            />
          </div>
        ) : null,
      },
      {
        key: "historial",
        label: (
          <span className="flex items-center gap-2 px-2">
            <FaHistory className="text-sm" />
            Registro de Abonos
          </span>
        ),
        disabled: false,
        children: selectedDeuda ? (
          <div className="pt-2 animate-in slide-in-from-right-4 duration-500">
            <HistorialAbonos 
              deuda={selectedDeuda} 
              onEditarAbono={handleEditarAbono}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
            <FaHistory size={48} className="mb-4" />
            <p className="text-lg font-semibold">Selecciona una deuda primero</p>
            <p className="text-sm">Ve a "Catálogo de Deudas" y selecciona una deuda para ver su historial de abonos</p>
          </div>
        ),
      },
    ],
    [selectedDeuda, userId, abonoToEdit]
  );

  return (
    <Modal
      title={
        <div className="flex items-center justify-between w-full pr-8 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
              <FaCoins size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 m-0 tracking-tight leading-none mb-1">
                Gestión de Deudas
              </h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest m-0">
                Faltantes de Caja & Arqueos
              </p>
            </div>
          </div>

          <Tooltip
            title="Las deudas se generan cuando hay faltantes de dinero al cerrar caja. Puedes abonar en partes o liquidar el monto total."
            placement="bottomRight"
            color="#0f172a"
          >
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-help transition-colors hover:bg-slate-100 group">
              <FaInfoCircle className="text-slate-400 group-hover:text-slate-600" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Información del Módulo</span>
            </div>
          </Tooltip>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      destroyOnClose
      className="modal-premium"
      centered
    >
      <div className="min-h-[600px] pt-4 px-1">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={tabItems}
          animated={{ inkBar: true, tabPane: true }}
          className="custom-premium-tabs"
        />
      </div>
    </Modal>
  );
}
