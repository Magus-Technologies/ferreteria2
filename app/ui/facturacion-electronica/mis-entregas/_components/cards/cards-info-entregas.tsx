'use client'

import { useMemo } from 'react'
import useGetEntregas from '../../_hooks/use-get-entregas'

function CardMiniInfo({
  title,
  value,
  icon,
  color = 'blue',
}: {
  title: string
  value: number
  icon: string
  color?: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    cyan: 'text-cyan-600',
    green: 'text-green-600',
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-2 border rounded-lg shadow-md w-full bg-white">
      <div className="text-2xl mb-1">{icon}</div>
      <h3 className="text-xs font-medium text-center text-slate-600">
        {title}
      </h3>
      <p className={`text-lg font-bold ${colorClasses[color] || 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  )
}

export default function CardsInfoEntregas() {
  const { entregas } = useGetEntregas()

  // Total de entregas
  const totalEntregas = useMemo(() => entregas.length, [entregas])

  // Entregas pendientes
  const entregasPendientes = useMemo(
    () => entregas.filter((e) => e.estado_entrega === 'PENDIENTE').length,
    [entregas]
  )

  // Entregas en camino
  const entregasEnCamino = useMemo(
    () => entregas.filter((e) => e.estado_entrega === 'EN_CAMINO').length,
    [entregas]
  )

  // Entregas completadas
  const entregasCompletadas = useMemo(
    () => entregas.filter((e) => e.estado_entrega === 'ENTREGADO').length,
    [entregas]
  )

  return (
    <>
      <CardMiniInfo
        title="Total Entregas"
        value={totalEntregas}
        icon="📦"
        color="blue"
      />
      
      <CardMiniInfo
        title="Pendientes"
        value={entregasPendientes}
        icon="⏳"
        color="orange"
      />
      
      <CardMiniInfo
        title="En Camino"
        value={entregasEnCamino}
        icon="🚚"
        color="cyan"
      />
      
      <CardMiniInfo
        title="Completadas"
        value={entregasCompletadas}
        icon="✅"
        color="green"
      />
    </>
  )
}
