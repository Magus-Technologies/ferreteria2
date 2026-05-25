'use client'

import { FaTruck, FaCheckCircle, FaClock, FaBan } from 'react-icons/fa'
import { useStoreVentaSeleccionada } from '../../_store/store-venta-seleccionada'

interface CardProps {
  label: string
  value: number
  icon: React.ReactNode
  colorClass: string
}

function Card({ label, value, icon, colorClass }: CardProps) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 border ${colorClass}`}>
      <div className="text-xl">{icon}</div>
      <div className="leading-tight">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-bold text-slate-800">{value}</div>
      </div>
    </div>
  )
}

export default function CardsInfoMisEntregas() {
  const venta = useStoreVentaSeleccionada(s => s.venta)

  if (!venta) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
        Seleccione una venta para ver el resumen de entregas
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
        {venta.venta_numero} — {venta.cliente_nombre}
      </div>
      <Card
        label="Entregadas"
        value={venta.completadas}
        icon={<FaCheckCircle className="text-green-500" />}
        colorClass="bg-green-50 border-green-200"
      />
      <Card
        label="En Camino"
        value={venta.en_camino}
        icon={<FaTruck className="text-blue-500" />}
        colorClass="bg-blue-50 border-blue-200"
      />
      <Card
        label="Pendientes"
        value={venta.pendientes}
        icon={<FaClock className="text-amber-500" />}
        colorClass="bg-amber-50 border-amber-200"
      />
      <Card
        label="Canceladas"
        value={venta.canceladas}
        icon={<FaBan className="text-red-400" />}
        colorClass="bg-red-50 border-red-200"
      />
    </div>
  )
}
