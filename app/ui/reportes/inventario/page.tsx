'use client'

import { useState } from 'react'
import { FaCartShopping } from 'react-icons/fa6'
import { Select } from 'antd'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'

const topProductos = [
  { xAxis: 'P1', importe: 10010 },
  { xAxis: 'P2', importe: 5900 },
  { xAxis: 'P3', importe: 4141 },
  { xAxis: 'P4', importe: 3025 },
  { xAxis: 'P5', importe: 1200 },
  { xAxis: 'P6', importe: 1050 },
  { xAxis: 'P7', importe: 708 },
  { xAxis: 'P8', importe: 600 },
  { xAxis: 'P9', importe: 544 },
  { xAxis: 'P10', importe: 522 },
  { xAxis: 'P11', importe: 340 },
  { xAxis: 'P12', importe: 287 },
  { xAxis: 'P13', importe: 205 },
  { xAxis: 'P14', importe: 159 },
  { xAxis: 'P15', importe: 118 },
  { xAxis: 'P16', importe: 93 },
  { xAxis: 'P17', importe: 82 },
  { xAxis: 'P18', importe: 80 },
  { xAxis: 'P19', importe: 78 },
  { xAxis: 'P20', importe: 68 },
]

const reportesAvanzados = [
  'Productos',
  'Movimiento Productos',
  'Transferencia Productos',
  'Cantidades Vendidas por Productos',
  'Stock Valorizado',
  'Kardex Valorizado',
  'Stock Valorizado por Fecha',
  'Lista de Precios',
]

export default function ReporteInventarioPage() {
  const canAccess = usePermission(permissions.REPORTES_INVENTARIO_INDEX)
  const [periodo, setPeriodo] = useState('anio_actual')
  const [tipoReporte, setTipoReporte] = useState('ventas')

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Productos / Servicios"
        icon={<FaCartShopping className="text-teal-600" />}
      />

      {/* Gráfico de Productos */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Grafico de Productos/Servicios</h3>
        <p className='text-xs text-slate-400 mb-2'>Top de Productos/Servicios por Ano actual</p>

        <div className='flex flex-wrap gap-3 mb-4 justify-end'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-slate-500'>Seleccionar periodo:</span>
            <Select
              value={periodo}
              onChange={setPeriodo}
              size='small'
              style={{ width: 140 }}
              options={[
                { value: 'anio_actual', label: 'Ano actual' },
                { value: 'mes_actual', label: 'Mes actual' },
                { value: 'semana_actual', label: 'Semana actual' },
              ]}
            />
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-slate-500'>Tipo de reporte:</span>
            <Select
              value={tipoReporte}
              onChange={setTipoReporte}
              size='small'
              style={{ width: 140 }}
              options={[
                { value: 'ventas', label: 'Por ventas' },
                { value: 'utilidad', label: 'Por utilidad' },
                { value: 'recurrencia', label: 'Por recurrencia' },
              ]}
            />
          </div>
        </div>

        <ResponsiveContainer width='100%' height={350}>
          <BarChart data={topProductos}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis dataKey='xAxis' tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `S/. ${value.toLocaleString()}`}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar dataKey='importe' name='Importe' fill='#f87171' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reportes Avanzados */}
      <div className='mt-8 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-3'>Reportes Avanzados</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
          {reportesAvanzados.map((titulo) => (
            <CardReporteAvanzado key={titulo} titulo={titulo} />
          ))}
        </div>
      </div>
    </ContenedorGeneral>
  )
}
