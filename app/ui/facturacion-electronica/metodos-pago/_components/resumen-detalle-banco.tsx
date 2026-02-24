'use client'

import { useState } from 'react'
import { Spin } from 'antd'
import type { MetodoDePago } from '~/lib/api/metodo-de-pago'
import { useResumenBanco } from '../_hooks/use-resumen-banco'
import dayjs from 'dayjs'

interface Props {
 banco: MetodoDePago
 onClose?: () => void
}

export default function ResumenDetalleBanco({ banco, onClose }: Props) {
 const [activeTab, setActiveTab] = useState('resumen')
 const [activeSubTab, setActiveSubTab] = useState<Record<string, number>>({ ing: 0, egr: 0 })
 const [dateFrom, setDateFrom] = useState(dayjs().format('YYYY-MM-DD'))
 const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'))
 const [filterMethod, setFilterMethod] = useState('')
 const [filterCaja, setFilterCaja] = useState('')
 const [searchText, setSearchText] = useState('')
 
 const [appliedFilters, setAppliedFilters] = useState({
  fecha_inicio: dayjs().format('YYYY-MM-DD'),
  fecha_fin: dayjs().format('YYYY-MM-DD'),
 })

 const { data: resumen, isLoading } = useResumenBanco(banco.id, appliedFilters)

 const handleApplyFilters = () => {
  setAppliedFilters({
   fecha_inicio: dateFrom,
   fecha_fin: dateTo,
   ...(filterMethod && { despliegue_pago_id: filterMethod }),
   ...(filterCaja && { sub_caja_id: filterCaja }),
  })
 }

 const handleResetFilters = () => {
  const today = dayjs().format('YYYY-MM-DD')
  setDateFrom(today)
  setDateTo(today)
  setFilterMethod('')
  setFilterCaja('')
  setSearchText('')
  setAppliedFilters({
   fecha_inicio: today,
   fecha_fin: today,
  })
 }

 return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
   <div className="bg-white border border-slate-300 rounded-xl w-full max-w-[1020px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
    
    {/* HEADER */}
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-slate-300 px-6 pt-[18px] pb-0 flex-shrink-0">
     <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
       <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
         Resumen Detallado — {banco.name}
        </h2>
        <p className="text-xs text-slate-600 mt-0.5 font-mono">
         Titular: {banco.nombre_titular || 'N/A'} · Cuenta: {banco.cuenta_bancaria || 'N/A'}
        </p>
       </div>
      </div>
      <button
       onClick={onClose}
       className="w-8 h-8 bg-slate-100 border border-slate-300 text-slate-600 rounded-lg flex items-center justify-center text-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-all"
      >
       X
      </button>
     </div>

     {/* FILTER BAR */}
     <div className="flex items-center gap-2.5 pb-4 flex-wrap">
      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2.5 py-1.5">
       <label className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide whitespace-nowrap">Desde</label>
       <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="bg-transparent border-none outline-none text-slate-800 font-mono text-xs cursor-pointer"
       />
       <span className="text-slate-600 text-xs">—</span>
       <label className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">Hasta</label>
       <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="bg-transparent border-none outline-none text-slate-800 font-mono text-xs cursor-pointer"
       />
      </div>

      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2.5 py-1.5">
       <label className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide whitespace-nowrap">Método</label>
       <select
        value={filterMethod}
        onChange={(e) => setFilterMethod(e.target.value)}
        className="bg-transparent border-none outline-none text-slate-800 font-mono text-xs cursor-pointer"
       >
        <option value="">Todos</option>
        {banco.despliegues_de_pagos?.map((dp: any) => (
         <option key={dp.id} value={dp.id}>{dp.name}</option>
        ))}
       </select>
      </div>

      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2.5 py-1.5">
       <label className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide whitespace-nowrap">Sub-Caja</label>
       <select
        value={filterCaja}
        onChange={(e) => setFilterCaja(e.target.value)}
        className="bg-transparent border-none outline-none text-slate-800 font-mono text-xs cursor-pointer"
       >
        <option value="">Todas</option>
       </select>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 flex-1 min-w-[160px]">
       <input
        type="text"
        placeholder="Buscar venta, cliente, concepto..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="bg-transparent border-none outline-none text-slate-800 text-xs w-full placeholder:text-slate-600"
       />
      </div>

      <button
       onClick={handleApplyFilters}
       disabled={isLoading}
       className="bg-amber-600 text-white border-none rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:bg-amber-700 transition-all whitespace-nowrap disabled:opacity-50"
      >
       Filtrar
      </button>

      <button
       onClick={handleResetFilters}
       className="bg-white text-slate-600 border border-slate-300 rounded-md px-3 py-1.5 text-xs cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-all"
      >
       Limpiar
      </button>
     </div>

     {/* TABS */}
     <div className="flex gap-0.5 border-b border-slate-300 overflow-x-auto scrollbar-hide">
      {[
       { key: 'resumen', label: 'Resumen' },
       { key: 'ingresos', label: 'Ingresos' },
       { key: 'egresos', label: 'Egresos' },
       { key: 'movimientos', label: 'Mov. Internos' },
       { key: 'analisis', label: 'Análisis' },
      ].map((tab) => (
       <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        className={`bg-transparent border-none px-[18px] py-3 text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap border-b-2 -mb-px ${
         activeTab === tab.key
          ? 'text-amber-600 border-amber-600'
          : 'text-slate-600 border-transparent hover:text-slate-800 hover:bg-white'
        }`}
       >
        {tab.label}
       </button>
      ))}
     </div>
    </div>

    {/* SUMMARY CARDS */}
    {isLoading ? (
     <div className="flex items-center justify-center py-20">
      <Spin size="large" />
     </div>
    ) : (
     <>
      <div className="grid grid-cols-4 gap-3 px-6 pt-4 pb-3 flex-shrink-0">
       <StatCard
        label="Monto Inicial"
        value={`S/. ${(resumen?.resumen?.monto_inicial || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle="Al inicio del período"
        color="blue"
       />
       <StatCard
        label="Total Ingresos"
        value={`S/. ${(resumen?.resumen?.total_ingresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        color="green"
       />
       <StatCard
        label="Total Egresos"
        value={`S/. ${(resumen?.resumen?.total_egresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        color="red"
       />
       <StatCard
        label="Saldo Final"
        value={`S/. ${(resumen?.resumen?.saldo_final || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle={dayjs().format('DD/MM/YYYY')}
        color="orange"
       />
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent">
       {activeTab === 'resumen' && <TabResumen data={resumen?.desglose_por_metodo || []} />}
       {activeTab === 'ingresos' && (
        <TabIngresos
         ventas={resumen?.ventas || []}
         otrosIngresos={resumen?.otros_ingresos || []}
         prestamosRecibidos={resumen?.prestamos_recibidos || []}
         activeSubTab={activeSubTab.ing}
         setActiveSubTab={(idx) => setActiveSubTab({ ...activeSubTab, ing: idx })}
        />
       )}
       {activeTab === 'egresos' && (
        <TabEgresos
         gastos={resumen?.gastos || []}
         prestamosDados={resumen?.prestamos_dados || []}
         activeSubTab={activeSubTab.egr}
         setActiveSubTab={(idx) => setActiveSubTab({ ...activeSubTab, egr: idx })}
        />
       )}
       {activeTab === 'movimientos' && <TabMovimientos data={resumen?.movimientos_internos || []} />}
       {activeTab === 'analisis' && <TabAnalisis data={resumen} />}
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-300 px-6 py-3.5 flex items-center gap-2 bg-white flex-shrink-0 flex-wrap">
       <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border transition-all bg-green-500/10 text-green-500 border-green-500/25 hover:bg-green-500/15">
        Excel
       </button>
       <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border transition-all bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500/15">
        PDF
       </button>
       <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border transition-all bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-800">
        Imprimir
       </button>
      </div>
     </>
    )}
   </div>
  </div>
 )
}

// Componente de tarjeta de estadística
interface StatCardProps {
 label: string
 value: string
 subtitle?: string
 color: 'blue' | 'green' | 'red' | 'orange'
}

function StatCard({ label, value, subtitle, color }: StatCardProps) {
 const colorClasses = {
  blue: 'before:bg-blue-500',
  green: 'before:bg-green-500',
  red: 'before:bg-red-500',
  orange: 'before:text-amber-600',
 }

 return (
  <div className={`bg-white border border-slate-300 rounded-lg px-4 py-3.5 relative overflow-hidden hover:border-[#3a4060] transition-colors before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:rounded-t-[10px] ${colorClasses[color]}`}>
   <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide mb-2">
    {label}
   </div>
   <div className="font-mono text-xl font-medium text-slate-800 tracking-tight">
    {value}
   </div>
   {subtitle && (
    <div className="text-[11px] text-slate-600 mt-1">{subtitle}</div>
   )}
  </div>
 )
}

// Tab Resumen General
function TabResumen({ data }: { data: any[] }) {
 const totales = data.reduce(
  (acc, item) => ({
   total_ingresos: acc.total_ingresos + (parseFloat(item.total_ingresos) || 0),
   total_egresos: acc.total_egresos + (parseFloat(item.total_egresos) || 0),
   neto: acc.neto + (parseFloat(item.neto) || 0),
  }),
  { total_ingresos: 0, total_egresos: 0, neto: 0 }
 )

 const maxMonto = Math.max(
  ...data.flatMap(item => [parseFloat(item.total_ingresos) || 0, parseFloat(item.total_egresos) || 0])
 )

 return (
  <div className="px-6 py-4">
   <div className="text-[13px] font-semibold text-slate-600 mb-3">Desglose por Método de Pago</div>
   <div className="rounded-lg overflow-hidden border border-slate-300">
    <table className="w-full border-collapse text-[13px]">
     <thead>
      <tr className="bg-slate-100">
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Método</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Ingresos</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Egresos</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Neto</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">% del Total</th>
      </tr>
     </thead>
     <tbody>
      {data.map((item, idx) => {
       const porcentaje = totales.neto !== 0 ? Math.abs((parseFloat(item.neto) / totales.neto) * 100) : 0
       return (
        <tr key={idx} className="hover:bg-slate-100 transition-colors">
         <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/12 text-purple-400">
           {item.metodo}
          </span>
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-green-500 font-mono font-semibold">
          S/. {(parseFloat(item.total_ingresos) || 0).toFixed(2)}
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-red-500 font-mono font-semibold">
          S/. {(parseFloat(item.total_egresos) || 0).toFixed(2)}
         </td>
         <td className={`px-3 py-2.5 border-b border-slate-300 font-mono font-semibold ${parseFloat(item.neto) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          S/. {(parseFloat(item.neto) || 0).toFixed(2)}
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300">
          <div className="flex items-center gap-2">
           <span className="w-10 text-xs font-mono text-slate-600">
            {porcentaje.toFixed(1)}%
           </span>
           <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
            <div
             className="h-full rounded-full bg-purple-500 transition-all duration-500"
             style={{ width: `${porcentaje}%` }}
            />
           </div>
          </div>
         </td>
        </tr>
       )
      })}
      <tr className="bg-white font-bold border-t-2 border-[#3a4060]">
       <td className="px-3 py-2.5 text-slate-800">TOTAL</td>
       <td className="px-3 py-2.5 text-green-500 font-mono">S/. {totales.total_ingresos.toFixed(2)}</td>
       <td className="px-3 py-2.5 text-red-500 font-mono">S/. {totales.total_egresos.toFixed(2)}</td>
       <td className={`px-3 py-2.5 font-mono ${totales.neto >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        S/. {totales.neto.toFixed(2)}
       </td>
       <td className="px-3 py-2.5 text-slate-600 text-xs">100%</td>
      </tr>
     </tbody>
    </table>
   </div>

   {/* BAR CHART */}
   <div className="mt-5">
    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
     Ingresos vs Egresos por Método
    </div>
    <div className="flex flex-col gap-2">
     {data.map((item, idx) => (
      <div key={idx}>
       <div className="flex items-center gap-2.5">
        <div className="w-[140px] text-xs text-slate-600 text-right flex-shrink-0">
         {item.metodo} — Ingresos
        </div>
        <div className="flex-1 h-[22px] bg-slate-100 rounded overflow-hidden">
         <div
          className="h-full rounded flex items-center px-2 text-[11px] font-semibold text-green-500 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
           width: `${maxMonto > 0 ? (parseFloat(item.total_ingresos) / maxMonto) * 100 : 0}%`,
           background: 'linear-gradient(90deg, rgba(34,197,94,0.25), rgba(34,197,94,0.5))',
           minWidth: parseFloat(item.total_ingresos) > 0 ? '8px' : '0',
          }}
         >
          {parseFloat(item.total_ingresos) > 0 && `S/. ${parseFloat(item.total_ingresos).toFixed(0)}`}
         </div>
        </div>
        <div className="w-[90px] font-mono text-[11px] text-slate-600">
         S/. {(parseFloat(item.total_ingresos) || 0).toFixed(2)}
        </div>
       </div>
       <div className="flex items-center gap-2.5 mt-2">
        <div className="w-[140px] text-xs text-slate-600 text-right flex-shrink-0">
         {item.metodo} — Egresos
        </div>
        <div className="flex-1 h-[22px] bg-slate-100 rounded overflow-hidden">
         <div
          className="h-full rounded flex items-center px-2 text-[11px] font-semibold text-red-500 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
           width: `${maxMonto > 0 ? (parseFloat(item.total_egresos) / maxMonto) * 100 : 0}%`,
           background: 'linear-gradient(90deg, rgba(239,68,68,0.25), rgba(239,68,68,0.5))',
           minWidth: parseFloat(item.total_egresos) > 0 ? '8px' : '0',
          }}
         >
          {parseFloat(item.total_egresos) > 0 && `S/. ${parseFloat(item.total_egresos).toFixed(0)}`}
         </div>
        </div>
        <div className="w-[90px] font-mono text-[11px] text-slate-600">
         S/. {(parseFloat(item.total_egresos) || 0).toFixed(2)}
        </div>
       </div>
      </div>
     ))}
    </div>
   </div>
  </div>
 )
}

// Tab Ingresos
function TabIngresos({
 ventas,
 otrosIngresos,
 prestamosRecibidos,
 activeSubTab,
 setActiveSubTab,
}: {
 ventas: any[]
 otrosIngresos: any[]
 prestamosRecibidos: any[]
 activeSubTab: number
 setActiveSubTab: (idx: number) => void
}) {
 const subtabs = [
  { label: `Ventas (${ventas.length})`, data: ventas, type: 'ventas' },
  { label: `Otros Ingresos (${otrosIngresos.length})`, data: otrosIngresos, type: 'otros' },
  { label: `Préstamos Recibidos (${prestamosRecibidos.length})`, data: prestamosRecibidos, type: 'prestamos' },
 ]

 return (
  <div className="px-6 py-4">
   <div className="flex gap-1 mb-4 flex-wrap">
    {subtabs.map((tab, idx) => (
     <button
      key={idx}
      onClick={() => setActiveSubTab(idx)}
      className={`px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all ${
       activeSubTab === idx
        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 hover:text-slate-800'
      }`}
     >
      {tab.label}
     </button>
    ))}
   </div>

   <div className="text-[13px] font-semibold text-slate-600 mb-3 flex items-center gap-2">
    {subtabs[activeSubTab].label.split('(')[0].trim()}
    <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-medium">
     {subtabs[activeSubTab].data.length} {subtabs[activeSubTab].type === 'ventas' ? 'transacciones' : 'registros'}
    </span>
   </div>

   <div className="rounded-lg overflow-hidden border border-slate-300">
    <table className="w-full border-collapse text-[13px]">
     <thead>
      <tr className="bg-slate-100">
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Hora</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">
        {activeSubTab === 0 ? 'N° Venta' : activeSubTab === 2 ? 'De' : 'Concepto'}
       </th>
       {activeSubTab === 0 && (
        <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Cliente</th>
       )}
       {activeSubTab === 2 && (
        <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Concepto</th>
       )}
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Método</th>
       {activeSubTab !== 2 && (
        <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Sub-Caja</th>
       )}
       <th className="px-3 py-2.5 text-right text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Monto</th>
      </tr>
     </thead>
     <tbody>
      {subtabs[activeSubTab].data.length === 0 ? (
       <tr>
        <td colSpan={activeSubTab === 0 ? 6 : activeSubTab === 2 ? 5 : 5} className="px-3 py-8 text-center text-slate-600 text-[13px]">
         No hay registros
        </td>
       </tr>
      ) : (
       subtabs[activeSubTab].data.map((item: any, idx: number) => (
        <tr key={idx} className="hover:bg-slate-100 transition-colors cursor-pointer">
         <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800 font-mono text-xs">
          {item.hora || dayjs(item.fecha).format('HH:mm')}
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-blue-500 font-mono text-xs">
          {item.numero_comprobante || item.de || item.concepto}
         </td>
         {activeSubTab === 0 && (
          <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800">
           {item.cliente || 'Público'}
          </td>
         )}
         {activeSubTab === 2 && (
          <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800">
           {item.concepto || '-'}
          </td>
         )}
         <td className="px-3 py-2.5 border-b border-slate-300">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/12 text-purple-400">
           {item.metodo_pago}
          </span>
         </td>
         {activeSubTab !== 2 && (
          <td className="px-3 py-2.5 border-b border-slate-300 text-slate-600">
           {item.sub_caja || '-'}
          </td>
         )}
         <td className="px-3 py-2.5 border-b border-slate-300 text-right text-green-500 font-mono font-semibold">
          S/. {(parseFloat(item.monto) || 0).toFixed(2)}
         </td>
        </tr>
       ))
      )}
      {subtabs[activeSubTab].data.length > 0 && (
       <tr className="bg-slate-100 font-semibold border-t border-[#3a4060]">
        <td colSpan={activeSubTab === 0 ? 5 : activeSubTab === 2 ? 4 : 4} className="px-3 py-2.5 text-right text-xs text-slate-600">
         SUBTOTAL {subtabs[activeSubTab].type === 'ventas' ? 'VENTAS' : ''}
        </td>
        <td className="px-3 py-2.5 text-right text-green-500 font-mono">
         S/. {subtabs[activeSubTab].data.reduce((sum: number, item: any) => sum + (parseFloat(item.monto) || 0), 0).toFixed(2)}
        </td>
       </tr>
      )}
     </tbody>
    </table>
   </div>

   {/* Export Buttons */}
   <div className="flex gap-2 mt-3 justify-end">
    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border transition-all bg-green-500/10 text-green-500 border-green-500/25 hover:bg-green-500/15">
     Exportar Excel
    </button>
    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border transition-all bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500/15">
     Exportar PDF
    </button>
   </div>
  </div>
 )
}

// Tab Egresos
function TabEgresos({
 gastos,
 prestamosDados,
 activeSubTab,
 setActiveSubTab,
}: {
 gastos: any[]
 prestamosDados: any[]
 activeSubTab: number
 setActiveSubTab: (idx: number) => void
}) {
 const subtabs = [
  { label: `Gastos (${gastos.length})`, data: gastos, type: 'gastos' },
  { label: `Préstamos Dados (${prestamosDados.length})`, data: prestamosDados, type: 'prestamos' },
 ]

 return (
  <div className="px-6 py-4">
   <div className="flex gap-1 mb-4 flex-wrap">
    {subtabs.map((tab, idx) => (
     <button
      key={idx}
      onClick={() => setActiveSubTab(idx)}
      className={`px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all ${
       activeSubTab === idx
        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 hover:text-slate-800'
      }`}
     >
      {tab.label}
     </button>
    ))}
   </div>

   <div className="text-[13px] font-semibold text-slate-600 mb-3 flex items-center gap-2">
    {subtabs[activeSubTab].label.split('(')[0].trim()}
    <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-medium">
     {subtabs[activeSubTab].data.length} {subtabs[activeSubTab].type === 'gastos' ? 'transacciones' : 'registros'}
    </span>
   </div>

   <div className="rounded-lg overflow-hidden border border-slate-300">
    <table className="w-full border-collapse text-[13px]">
     <thead>
      <tr className="bg-slate-100">
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Hora</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">
        {activeSubTab === 1 ? 'A quién' : 'Concepto'}
       </th>
       {activeSubTab === 1 && (
        <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Concepto</th>
       )}
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Método</th>
       {activeSubTab === 0 && (
        <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Sub-Caja</th>
       )}
       <th className="px-3 py-2.5 text-right text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Monto</th>
      </tr>
     </thead>
     <tbody>
      {subtabs[activeSubTab].data.length === 0 ? (
       <tr>
        <td colSpan={activeSubTab === 0 ? 5 : 5} className="px-3 py-8 text-center text-slate-600 text-[13px]">
         No hay {activeSubTab === 0 ? 'gastos' : 'préstamos'} registrados
        </td>
       </tr>
      ) : (
       subtabs[activeSubTab].data.map((item: any, idx: number) => (
        <tr key={idx} className="hover:bg-slate-100 transition-colors cursor-pointer">
         <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800 font-mono text-xs">
          {item.hora || dayjs(item.fecha).format('HH:mm')}
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800">
          {item.a_quien || item.concepto}
         </td>
         {activeSubTab === 1 && (
          <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800">
           {item.concepto || '-'}
          </td>
         )}
         <td className="px-3 py-2.5 border-b border-slate-300">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/12 text-purple-400">
           {item.metodo_pago}
          </span>
         </td>
         {activeSubTab === 0 && (
          <td className="px-3 py-2.5 border-b border-slate-300 text-slate-600">
           {item.sub_caja || '-'}
          </td>
         )}
         <td className="px-3 py-2.5 border-b border-slate-300 text-right text-red-500 font-mono font-semibold">
          S/. {(parseFloat(item.monto) || 0).toFixed(2)}
         </td>
        </tr>
       ))
      )}
      {subtabs[activeSubTab].data.length > 0 && (
       <tr className="bg-slate-100 font-semibold border-t border-[#3a4060]">
        <td colSpan={activeSubTab === 0 ? 4 : 4} className="px-3 py-2.5 text-right text-xs text-slate-600">
         SUBTOTAL {activeSubTab === 0 ? 'GASTOS' : ''}
        </td>
        <td className="px-3 py-2.5 text-right text-red-500 font-mono">
         S/. {subtabs[activeSubTab].data.reduce((sum: number, item: any) => sum + (parseFloat(item.monto) || 0), 0).toFixed(2)}
        </td>
       </tr>
      )}
     </tbody>
    </table>
   </div>

   {/* Export Buttons */}
   <div className="flex gap-2 mt-3 justify-end">
    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border transition-all bg-green-500/10 text-green-500 border-green-500/25 hover:bg-green-500/15">
     Exportar Excel
    </button>
    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer border transition-all bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500/15">
     Exportar PDF
    </button>
   </div>
  </div>
 )
}

// Tab Movimientos Internos
function TabMovimientos({ data }: { data: any[] }) {
 return (
  <div className="px-6 py-4">
   <div className="text-[13px] font-semibold text-slate-600 mb-3 flex items-center gap-2">
    Transferencias entre Sub-Cajas
    <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-medium">
     {data.length} movimientos
    </span>
   </div>

   <div className="rounded-lg overflow-hidden border border-slate-300">
    <table className="w-full border-collapse text-[13px]">
     <thead>
      <tr className="bg-slate-100">
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Hora</th>
       <th className="px-3 py-2.5 text-center text-slate-600 text-[11px] font-semibold uppercase tracking-wide w-[60px]">Tipo</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Origen</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Destino</th>
       <th className="px-3 py-2.5 text-left text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Método</th>
       <th className="px-3 py-2.5 text-right text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Monto</th>
      </tr>
     </thead>
     <tbody>
      {data.length === 0 ? (
       <tr>
        <td colSpan={6} className="px-3 py-8 text-center text-slate-600 text-[13px]">
         No hay movimientos internos en este período
        </td>
       </tr>
      ) : (
       data.map((item: any, idx: number) => (
        <tr key={idx} className="hover:bg-slate-100 transition-colors">
         <td className="px-3 py-2.5 border-b border-slate-300 text-slate-800 font-mono text-xs">
          {dayjs(item.fecha).format('HH:mm')}
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-center">
          <span className="text-base">
           {item.tipo === 'salida' ? '→' : '←'}
          </span>
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-slate-600">
          {item.sub_caja_origen}
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-blue-500">
          {item.sub_caja_destino}
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/12 text-purple-400">
           {item.metodo_pago || 'Transferencia'}
          </span>
         </td>
         <td className="px-3 py-2.5 border-b border-slate-300 text-right text-amber-600 font-mono font-semibold">
          S/. {(parseFloat(item.monto) || 0).toFixed(2)}
         </td>
        </tr>
       ))
      )}
     </tbody>
    </table>
   </div>

   <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-md px-3.5 py-2.5 text-xs text-blue-500 mt-3">
    <span>
     Estos movimientos <strong>NO afectan</strong> el saldo total del banco — son traslados internos entre sub-cajas.
    </span>
   </div>
  </div>
 )
}


// Tab Análisis
function TabAnalisis({ data }: { data: any }) {
 // Mock data for demonstration - replace with actual data from backend
 const hourlyData = [
  { hour: '08:00', count: 1 },
  { hour: '09:00', count: 2 },
  { hour: '10:00', count: 4 },
  { hour: '11:00', count: 6 },
  { hour: '12:00', count: 8 },
  { hour: '13:00', count: 7 },
  { hour: '14:00', count: 5 },
  { hour: '15:00', count: 4 },
  { hour: '16:00', count: 3 },
  { hour: '17:00', count: 2 },
  { hour: '18:00', count: 1 },
 ]

 const maxCount = Math.max(...hourlyData.map(d => d.count))

 const topClientes = [
  { nombre: 'Juan Pérez', ventas: 3, metodos: 'Yape + Transfer.', monto: 450 },
  { nombre: 'María López', ventas: 2, metodos: 'Transfer.', monto: 450 },
  { nombre: 'Carlos Ruiz', ventas: 2, metodos: 'Yape + Transfer.', monto: 280 },
  { nombre: 'Luis Vargas', ventas: 1, metodos: 'Yape', monto: 240 },
  { nombre: 'Ana Torres', ventas: 1, metodos: 'Transfer.', monto: 150 },
 ]

 const metodosDistribucion = data?.desglose_por_metodo || []
 const totalNeto = metodosDistribucion.reduce((sum: number, m: any) => sum + Math.abs(parseFloat(m.neto) || 0), 0)

 return (
  <div className="px-6 py-4">
   <div className="grid grid-cols-2 gap-5">
    {/* Left Column */}
    <div>
     <div className="text-[13px] font-semibold text-slate-600 mb-3">Transacciones por Hora</div>
     <div className="bg-white border border-slate-300 rounded-lg px-3 py-4">
      <div className="flex items-end gap-1.5 h-20">
       {hourlyData.map((item, idx) => {
        const heightPercent = (item.count / maxCount) * 100
        const opacity = 0.4 + (heightPercent / 100) * 0.6
        return (
         <div key={idx} className="flex flex-col items-center gap-1 flex-1">
          <div
           className="w-full rounded-t transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
           style={{
            height: `${heightPercent}%`,
            background: 'linear-gradient(180deg, #f97316, rgba(249,115,22,0.3))',
            opacity,
            minHeight: '4px',
           }}
          />
          <div className="text-[10px] text-slate-600 font-mono">
           {item.hour.slice(0, 2)}
          </div>
         </div>
        )
       })}
      </div>
     </div>

     <div className="text-[13px] font-semibold text-slate-600 mb-3 mt-5">Estadísticas Rápidas</div>
     <div className="grid grid-cols-3 gap-2.5">
      <div className="bg-white border border-slate-300 rounded-md px-3.5 py-3 text-center">
       <div className="text-[11px] text-slate-600 mb-1">Promedio/Transacción</div>
       <div className="font-mono text-base font-medium text-slate-800">S/. 98</div>
      </div>
      <div className="bg-white border border-slate-300 rounded-md px-3.5 py-3 text-center">
       <div className="text-[11px] text-slate-600 mb-1">Máx. Transacción</div>
       <div className="font-mono text-base font-medium text-red-500">S/. 3,300</div>
      </div>
      <div className="bg-white border border-slate-300 rounded-md px-3.5 py-3 text-center">
       <div className="text-[11px] text-slate-600 mb-1">Mín. Transacción</div>
       <div className="font-mono text-base font-medium text-green-500">S/. 80</div>
      </div>
      <div className="bg-white border border-slate-300 rounded-md px-3.5 py-3 text-center">
       <div className="text-[11px] text-slate-600 mb-1">Total Transacciones</div>
       <div className="font-mono text-base font-medium text-slate-800">26</div>
      </div>
      <div className="bg-white border border-slate-300 rounded-md px-3.5 py-3 text-center">
       <div className="text-[11px] text-slate-600 mb-1">Hora Pico</div>
       <div className="font-mono text-base font-medium text-amber-600">12:00</div>
      </div>
      <div className="bg-white border border-slate-300 rounded-md px-3.5 py-3 text-center">
       <div className="text-[11px] text-slate-600 mb-1">Métodos Usados</div>
       <div className="font-mono text-base font-medium text-slate-800">
        {metodosDistribucion.length}
       </div>
      </div>
     </div>
    </div>

    {/* Right Column */}
    <div>
     <div className="text-[13px] font-semibold text-slate-600 mb-3">Top 5 Clientes (por monto)</div>
     <div className="flex flex-col gap-2">
      {topClientes.map((cliente, idx) => {
       const rankClasses = ['gold', 'silver', 'bronze', '', '']
       const rankColors = {
        gold: 'bg-yellow-500/15 text-yellow-500',
        silver: 'bg-gray-400/15 text-gray-400',
        bronze: 'bg-amber-700/15 text-amber-700',
       }
       const rankClass = rankClasses[idx]
       return (
        <div
         key={idx}
         className="flex items-center gap-2.5 bg-white border border-slate-300 rounded-md px-3.5 py-2.5 hover:border-[#3a4060] transition-colors"
        >
         <div
          className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
           rankClass ? rankColors[rankClass as keyof typeof rankColors] : 'bg-slate-100 text-slate-600'
          }`}
         >
          {idx + 1}
         </div>
         <div className="flex-1">
          <div className="text-[13px] text-slate-800">{cliente.nombre}</div>
          <div className="text-[11px] text-slate-600">
           {cliente.ventas} ventas · {cliente.metodos}
          </div>
         </div>
         <div className="font-mono text-[13px] font-medium text-green-500">
          S/. {cliente.monto.toFixed(2)}
         </div>
        </div>
       )
      })}
     </div>

     <div className="text-[13px] font-semibold text-slate-600 mb-3 mt-5">Distribución por Método</div>
     <div className="flex flex-col gap-2">
      {metodosDistribucion.map((metodo: any, idx: number) => {
       const porcentaje = totalNeto > 0 ? (Math.abs(parseFloat(metodo.neto)) / totalNeto) * 100 : 0
       const colors = ['#a855f7', '#3b82f6', '#22c55e', '#eab308', '#f97316']
       const color = colors[idx % colors.length]
       return (
        <div key={idx} className="flex items-center gap-2.5">
         <div className="w-[110px] text-xs text-slate-600">{metodo.metodo}</div>
         <div className="flex-1 h-[22px] bg-slate-100 rounded overflow-hidden">
          <div
           className="h-full rounded flex items-center px-2 text-[11px] font-semibold transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
           style={{
            width: `${porcentaje}%`,
            background: `linear-gradient(90deg, ${color}30, ${color}99)`,
            color: color,
            minWidth: porcentaje > 0 ? '8px' : '0',
           }}
          >
           {porcentaje > 10 && `${porcentaje.toFixed(1)}%`}
          </div>
         </div>
        </div>
       )
      })}
     </div>
    </div>
   </div>
  </div>
 )
}
