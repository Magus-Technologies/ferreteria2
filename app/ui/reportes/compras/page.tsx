'use client'

import { useState, useEffect } from 'react'
import { FaBoxOpen, FaMoneyBillWave, FaCreditCard, FaExclamationTriangle } from 'react-icons/fa'
import { MdPointOfSale } from 'react-icons/md'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import CardReporteAvanzado from '../_components/cards/card-reporte-avanzado'
import { compraApi, type CompraReporteFilters } from '~/lib/api/compra'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { exportReporteComprasToExcel } from '~/utils/export-reporte-compras-excel'

const { RangePicker } = DatePicker

export default function ReporteComprasPage() {
  const canAccess = usePermission(permissions.REPORTES_COMPRAS_INDEX)
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)

  const [filtros, setFiltros] = useState<CompraReporteFilters>({
    almacen_id,
    desde: dayjs().subtract(11, 'months').startOf('month').format('YYYY-MM-DD'),
    hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
  })

  const [exportingExcel, setExportingExcel] = useState(false)

  useEffect(() => {
    setFiltros((prev) => ({ ...prev, almacen_id }))
  }, [almacen_id])

  // Query: Resumen mensual para gráfico
  const { data: resumenMensualData, isLoading: loadingGrafico } = useQuery({
    queryKey: [QueryKeys.COMPRAS_RESUMEN_MENSUAL, filtros],
    queryFn: () => compraApi.getResumenMensual(filtros),
    enabled: !!filtros.almacen_id,
  })

  // Query: Resumen KPI cards
  const { data: resumenData, isLoading: loadingResumen } = useQuery({
    queryKey: [QueryKeys.COMPRAS_RESUMEN, filtros],
    queryFn: () => compraApi.getResumen(filtros),
    enabled: !!filtros.almacen_id,
  })

  if (!canAccess) return <NoAutorizado />

  const resumen = resumenData?.data?.data
  const datosMensuales = (resumenMensualData?.data?.data || []).map((item) => ({
    mes: dayjs(item.mes + '-01').format('MMM-YYYY').toUpperCase(),
    compras: Number(item.total),
    cantidad: item.cantidad,
  }))

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setFiltros((prev) => ({
        ...prev,
        desde: dates[0].format('YYYY-MM-DD'),
        hasta: dates[1].format('YYYY-MM-DD'),
      }))
    }
  }

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const res = await compraApi.getReporte({
        ...filtros,
        per_page: 10000,
        page: 1,
      })
      if (res.data?.data) {
        exportReporteComprasToExcel({
          items: res.data.data,
          nameFile: `Reporte_Compras_${dayjs().format('YYYYMMDD_HHmmss')}`,
          fechaDesde: filtros.desde ? dayjs(filtros.desde).format('DD/MM/YYYY') : undefined,
          fechaHasta: filtros.hasta ? dayjs(filtros.hasta).format('DD/MM/YYYY') : undefined,
        })
      }
    } catch {
      alert('Error al exportar el reporte')
    } finally {
      setExportingExcel(false)
    }
  }

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return 'S/. 0.00'
    return `S/. ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Compras"
        icon={<FaBoxOpen className="text-slate-500" />}
      />

      {/* Filtros */}
      <div className='flex items-center gap-3 mt-3 w-full'>
        <RangePicker
          value={[
            filtros.desde ? dayjs(filtros.desde) : null,
            filtros.hasta ? dayjs(filtros.hasta) : null,
          ]}
          onChange={handleDateChange}
          format='DD/MM/YYYY'
          size='middle'
          className='w-64'
        />
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 w-full'>
        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <MdPointOfSale className='text-blue-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Total Compras</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <>
              <p className='text-lg font-bold text-slate-800'>{formatMoney(resumen?.total_compras)}</p>
              <p className='text-xs text-slate-400'>{resumen?.total_transacciones || 0} transacciones</p>
            </>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaMoneyBillWave className='text-green-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Contado</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-green-600'>{formatMoney(resumen?.total_contado)}</p>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaCreditCard className='text-orange-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Crédito</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <>
              <p className='text-lg font-bold text-orange-600'>{formatMoney(resumen?.total_credito)}</p>
              <p className='text-xs text-slate-400'>Pagado: {formatMoney(resumen?.total_pagado)}</p>
            </>
          )}
        </div>

        <div className='bg-white rounded-lg border border-slate-200 p-4'>
          <div className='flex items-center gap-2 mb-1'>
            <FaExclamationTriangle className='text-red-500' size={18} />
            <span className='text-xs text-slate-500 uppercase font-semibold'>Saldo Pendiente</span>
          </div>
          {loadingResumen ? (
            <div className='h-6 bg-slate-100 rounded animate-pulse' />
          ) : (
            <p className='text-lg font-bold text-red-600'>{formatMoney(resumen?.saldo_pendiente)}</p>
          )}
        </div>
      </div>

      {/* Gráfico de Compras */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4 mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Gráfico de Compras</h3>
        <p className='text-xs text-slate-400 mb-4'>Montos totales por meses</p>

        {loadingGrafico ? (
          <div className='h-[350px] bg-slate-50 rounded flex items-center justify-center'>
            <span className='text-slate-400 text-sm'>Cargando gráfico...</span>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={350}>
            <AreaChart data={datosMensuales}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='mes' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `S/. ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              <Area
                type='monotone'
                dataKey='compras'
                name='Compras'
                stroke='#1e40af'
                fill='#1e40af20'
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Reportes Avanzados */}
      <div className='mt-8 w-full'>
        <h3 className='font-bold text-slate-700 text-base uppercase mb-3'>Reportes Avanzados</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          <CardReporteAvanzado
            titulo='Compras'
            onExcel={handleExportExcel}
            loadingExcel={exportingExcel}
          />
          <CardReporteAvanzado titulo='Detalle de Compras' />
          <CardReporteAvanzado titulo='Ordenes de Compra' />
          <CardReporteAvanzado titulo='Recepcion de Productos' />
          <CardReporteAvanzado titulo='Exportar Ordenes de Compra' />
        </div>
      </div>
    </ContenedorGeneral>
  )
}
