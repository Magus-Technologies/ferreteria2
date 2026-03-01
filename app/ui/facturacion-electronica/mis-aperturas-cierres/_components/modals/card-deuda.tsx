"use client";

import { Card, Tag, Progress } from "antd";
import {
  FaExclamationCircle,
  FaClock,
  FaCheckCircle,
  FaMoneyBillWave,
  FaStore,
  FaUser,
  FaReceipt,
} from "react-icons/fa";
import dayjs from "dayjs";
import type { DeudaPersonal } from "~/lib/api/deuda-personal";
import ButtonBase from "~/components/buttons/button-base";
import { cn } from "~/lib/utils";

interface CardDeudaProps {
  deuda: DeudaPersonal;
  onSelect: () => void;
}

export function CardDeuda({ deuda, onSelect }: CardDeudaProps) {
  const porcentajePagado =
    (deuda.monto_abonado / deuda.monto_original) * 100;

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return {
          color: "error",
          label: "PENDIENTE",
          icon: <FaExclamationCircle />,
          className: "bg-rose-50 border-rose-200 text-rose-700",
          tagColor: "error",
        };
      case "parcialmente_pagada":
        return {
          color: "warning",
          label: "PARCIAL",
          icon: <FaClock />,
          className: "bg-amber-50 border-amber-200 text-amber-700",
          tagColor: "warning",
        };
      case "pagada":
        return {
          color: "success",
          label: "PAGADA",
          icon: <FaCheckCircle />,
          className: "bg-emerald-50 border-emerald-200 text-emerald-700",
          tagColor: "success",
        };
      default:
        return {
          color: "default",
          label: estado,
          className: "bg-slate-50 border-slate-200 text-slate-700",
          tagColor: "default",
        };
    }
  };

  const estadoConfig = getEstadoConfig(deuda.estado);

  return (
    <Card
      className={cn(
        "group hover:shadow-xl transition-all duration-300 border-none rounded-2xl overflow-hidden mb-4 cursor-pointer",
        "bg-white shadow-md relative"
      )}
      bodyStyle={{ padding: '0' }}
      onClick={onSelect}
    >
      <div className="flex h-full">
        {/* Borde lateral de estado */}
        <div className={cn(
          "w-1.5 self-stretch",
          deuda.estado === 'pendiente' ? "bg-rose-500" :
            deuda.estado === 'parcialmente_pagada' ? "bg-amber-500" : "bg-emerald-500"
        )} />

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tag
                  color={estadoConfig.tagColor as any}
                  icon={estadoConfig.icon}
                  className="rounded-full px-3 font-semibold uppercase text-[10px]"
                >
                  {estadoConfig.label}
                </Tag>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <FaClock className="text-[10px]" />
                  {dayjs(deuda.arqueo_diario?.apertura_cierre_caja?.fecha_cierre).format("DD MMM, YYYY - HH:mm")}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FaReceipt className="text-slate-400" />
                Deuda por Faltante
              </h4>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Saldo Pendiente</div>
              <div className="text-2xl font-black text-slate-800">
                <span className="text-sm font-normal text-slate-500 mr-1">S/</span>
                {Number(deuda.saldo_pendiente).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                <FaStore />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Caja</div>
                <div className="text-sm font-semibold text-slate-700">
                  {deuda.arqueo_diario?.apertura_cierre_caja?.caja_principal?.nombre || "N/A"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                <FaUser />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vendedor</div>
                <div className="text-sm font-semibold text-slate-700">{deuda.user?.name || "N/A"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                <FaMoneyBillWave />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Monto Inicial</div>
                <div className="text-sm font-semibold text-slate-700">
                  S/ {Number(deuda.monto_original).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Progreso de Pago</span>
                <span className={cn(
                  "text-xs font-black",
                  porcentajePagado >= 100 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {porcentajePagado.toFixed(1)}%
                </span>
              </div>
              <Progress
                percent={porcentajePagado}
                size="small"
                status={deuda.estado === 'pagada' ? 'success' : 'active'}
                strokeColor={deuda.estado === 'pagada' ? '#10b981' : {
                  '0%': '#f43f5e',
                  '100%': '#f59e0b',
                }}
                showInfo={false}
                className="m-0"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-6 shrink-0">
              <ButtonBase
                color={deuda.estado === 'pagada' ? 'info' : 'warning'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="flex items-center gap-2"
              >
                {deuda.estado === 'pagada' ? (
                  <>
                    <FaCheckCircle />
                    Ver Historial
                  </>
                ) : (
                  <>
                    <FaMoneyBillWave />
                    Realizar Abono
                  </>
                )}
              </ButtonBase>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
