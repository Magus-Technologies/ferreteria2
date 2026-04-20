'use client'

import { FaCoins, FaCheckCircle, FaClock, FaUsers } from 'react-icons/fa'
import { useComisionesPorVendedor } from '../../_hooks/use-comisiones'
import { useStoreFiltrosComisiones } from '../../_store/store-filtros-comisiones'

function formatPEN(n: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(n)
}

export default function CardsResumenComisiones() {
  const filtros = useStoreFiltrosComisiones(s => s.filtros)
  const { data, isLoading } = useComisionesPorVendedor(filtros)

  const resumen = data?.resumen ?? {
    total_vendedores: 0,
    total_generado: 0,
    total_pagado: 0,
    total_pendiente: 0,
  }

  const cards = [
    {
      label: 'Total Generado',
      value: formatPEN(resumen.total_generado),
      icon: <FaCoins />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pagado',
      value: formatPEN(resumen.total_pagado),
      icon: <FaCheckCircle />,
      color: 'bg-green-50 text-green-700 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      label: 'Pendiente por Pagar',
      value: formatPEN(resumen.total_pendiente),
      icon: <FaClock />,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Vendedores',
      value: String(resumen.total_vendedores),
      icon: <FaUsers />,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      iconColor: 'text-slate-600',
    },
  ]

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
      {cards.map(card => (
        <div
          key={card.label}
          className={`rounded-xl border px-4 py-3 ${card.color} flex items-center gap-3`}
        >
          <div className={`text-2xl ${card.iconColor}`}>{card.icon}</div>
          <div className='flex flex-col'>
            <span className='text-xs opacity-80'>{card.label}</span>
            <span className='text-lg font-semibold'>
              {isLoading ? '...' : card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
