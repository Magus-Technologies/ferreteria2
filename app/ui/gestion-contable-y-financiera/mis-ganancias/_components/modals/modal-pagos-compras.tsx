'use client'

import { Modal, Spin, Input, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { gananciasApi } from '~/lib/api/ganancias'
import TableWithTitle from '~/components/tables/table-with-title'
import { useMemo, useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { apiRequest } from '~/lib/api'
import { FaShoppingCart, FaCheckCircle, FaExclamationCircle, FaSearch, FaMoneyBillWave } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import ButtonBase from '~/components/buttons/button-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'

interface ModalPagosComprasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

export default function ModalPagosCompras({ open, onClose, filtros: filtrosGlobales }: ModalPagosComprasProps) {
  // Filtros locales para el modal
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
    search: '',
    vista: 'pagos' as 'pagos' | 'gastos', // Nueva opción para alternar entre pagos y gastos
    tipoGasto: 'todos' as 'todos' | 'gasto_extra' | 'gasto_compra', // Filtro para tipo de gasto
  })
  const [debouncedSearch] = useDebounce(localFiltros.search, 500)

  // Sincronizar con el almacén global cuando se abre el modal
  useEffect(() => {
    if (open) {
      setLocalFiltros({
        desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
        hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
        search: '',
        vista: 'pagos',
        tipoGasto: 'todos',
      })
    }
  }, [open, filtrosGlobales.desde, filtrosGlobales.hasta])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['pagos-compras', localFiltros.desde, localFiltros.hasta, debouncedSearch, filtrosGlobales.almacen_id],
    queryFn: () => gananciasApi.getPagosCompras({
      desde: localFiltros.desde,
      hasta: localFiltros.hasta,
      search: debouncedSearch,
      almacen_id: filtrosGlobales.almacen_id
    }),
    enabled: open && !!localFiltros.desde && !!localFiltros.hasta,
  })

  // Query para obtener despliegues de pago con el formato detallado
  const { data: desplieguesData } = useQuery({
    queryKey: ['metodos-para-ventas-modal'],
    queryFn: async () => {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return response.data
    },
    enabled: open,
  })

  const despliegueMap = useMemo(() => {
    if (!desplieguesData?.data) return {}
    return desplieguesData.data.reduce((acc, metodo) => {
      acc[metodo.despliegue_pago_id] = metodo.label.toUpperCase()
      return acc
    }, {} as Record<string, string>)
  }, [desplieguesData])

  const pagos = data?.data?.data?.pagos || []
  const gastosRaw = data?.data?.data?.gastos || []

  // Filtrar gastos según el tipo seleccionado
  const gastos = useMemo(() => {
    if (localFiltros.tipoGasto === 'todos') return gastosRaw
    return gastosRaw.filter((g: any) => g.tipo === localFiltros.tipoGasto)
  }, [gastosRaw, localFiltros.tipoGasto])

  const resumen = data?.data?.data?.resumen || { total_compras: 0, total_pagado: 0, total_gastos: 0, pendiente: 0 }

  // Unificar pagos y gastos en una sola lista
  const dataUnificada = useMemo(() => {
    const pagosFormateados = pagos.map((p: any) => ({
      ...p,
      tipo_mov: 'PAGO',
      detalle: despliegueMap[p.despliegue_id] || p.metodo_pago?.toUpperCase() || p.numero_operacion || '-',
      monto_valor: Number(p.monto) || 0,
      row_color: 'bg-emerald-50 text-emerald-700'
    }))

    const gastosFormateados = gastosRaw.map((g: any) => ({
      ...g,
      tipo_mov: g.tipo === 'gasto_extra' ? 'GASTO OPERATIVO' : 'GASTO COMPRA',
      detalle: g.descripcion || g.tipo_gasto?.toUpperCase() || '-',
      monto_valor: Number(g.monto) || 0,
      row_color: 'bg-rose-50 text-rose-700'
    }))

    return [...pagosFormateados, ...gastosFormateados].sort((a, b) => dayjs(b.fecha).unix() - dayjs(a.fecha).unix())
  }, [pagos, gastosRaw, despliegueMap])

  const columnasUnificadas = useMemo<ColDef[]>(() => [
    {
      headerName: 'FECHA',
      field: 'fecha',
      width: 150,
      valueFormatter: (p) => p.value ? dayjs(p.value).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      headerName: 'TIPO',
      field: 'tipo_mov',
      width: 160,
      cellRenderer: (p: any) => {
        const isPago = p.value === 'PAGO'
        return (
          <div className="flex items-center h-full">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPago ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {p.value}
            </span>
          </div>
        )
      }
    },
    {
      headerName: 'PROVEEDOR',
      field: 'proveedor',
      flex: 1,
      minWidth: 180,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'DOCUMENTO',
      field: 'numero',
      width: 140,
      valueFormatter: (p) => {
        if (!p.data || (!p.data.numero && !p.data.serie)) return '-'
        return `${p.data.serie || ''}-${String(p.data.numero || '').padStart(8, '0')}`
      },
      cellClass: 'font-mono text-xs'
    },
    {
      headerName: 'DESCRIPCIÓN / DETALLE',
      field: 'detalle',
      flex: 2,
      minWidth: 250,
    },
    {
      headerName: 'MONTO',
      field: 'monto_valor',
      width: 120,
      type: 'numericColumn',
      cellStyle: (p) => ({ 
        fontWeight: 'bold', 
        color: p.data?.tipo_mov === 'PAGO' ? '#059669' : '#dc2626' 
      }) as any,
      valueFormatter: (p) => p.value ? `S/ ${Number(p.value).toFixed(2)}` : 'S/ 0.00',
    },
  ], [])

  const pinnedBottomRowData = useMemo(() => {
    if (dataUnificada.length === 0) return []
    return [
      {
        proveedor: 'TOTAL ACUMULADO (PAGOS + GASTOS):',
        monto_valor: resumen.total_pagado + resumen.total_gastos,
      },
    ]
  }, [dataUnificada, resumen.total_pagado, resumen.total_gastos])

  return (
    <Modal
      title="Análisis Unificado de Pagos y Gastos de Compras"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1300}
      centered
      styles={{ body: { padding: '16px' } }}
    >
      <div className="flex flex-col gap-4">
        {/* Filtros Internos */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3">
          <LabelBase label="Desde" orientation="column" className="!gap-1">
            <DatePickerBase
              value={localFiltros.desde ? dayjs(localFiltros.desde) : null}
              onChange={(date) => setLocalFiltros(prev => ({ ...prev, desde: date ? date.format('YYYY-MM-DD') : '' }))}
              allowClear
              className="!w-[130px]"
            />
          </LabelBase>

          <LabelBase label="Hasta" orientation="column" className="!gap-1">
            <DatePickerBase
              value={localFiltros.hasta ? dayjs(localFiltros.hasta) : null}
              onChange={(date) => setLocalFiltros(prev => ({ ...prev, hasta: date ? date.format('YYYY-MM-DD') : '' }))}
              allowClear
              className="!w-[130px]"
            />
          </LabelBase>
          
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Buscar Proveedor / Descripción / Documento
            </span>
            <Input 
              placeholder="Escriba aquí para buscar..." 
              prefix={<FaSearch className="text-slate-400" />}
              allowClear
              value={localFiltros.search}
              onChange={(e) => setLocalFiltros(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={() => refetch()}
            />
          </div>

          <ButtonBase 
            color="info" 
            size="md" 
            className="flex items-center gap-2 h-[32px] px-6"
            onClick={() => refetch()}
            loading={isFetching}
          >
            <FaSearch size={12} />
            Buscar
          </ButtonBase>
        </div>

        {/* Cards Informativos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <FaShoppingCart size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Total Compras</div>
              <div className="text-xl font-bold text-slate-700">S/ {resumen.total_compras.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
              <FaCheckCircle size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-emerald-600 font-bold">Total Pagado</div>
              <div className="text-xl font-bold text-emerald-700">S/ {resumen.total_pagado.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-rose-100 p-3 rounded-full text-rose-600">
              <FaMoneyBillWave size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-rose-600 font-bold">Total Gastos</div>
              <div className="text-xl font-bold text-rose-700">S/ {resumen.total_gastos.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-rose-100 p-3 rounded-full text-rose-600">
              <FaExclamationCircle size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-rose-600 font-bold">Falta Pagar (Pendiente)</div>
              <div className="text-xl font-bold text-rose-700">S/ {resumen.pendiente.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tabla Unificada */}
        <div className="h-[500px] w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-white">
              <Spin size="large" tip="Consolidando información de pagos y gastos..." />
            </div>
          ) : (
            <TableWithTitle
              id="table-modal-unificada-pagos-gastos"
              title="Historial Consolidado de Pagos y Gastos"
              columnDefs={columnasUnificadas}
              rowData={dataUnificada}
              loading={isLoading}
              pinnedBottomRowData={pinnedBottomRowData}
              headerColor="var(--color-slate-800)"
              selectionColor="#f1f5f9"
              withNumberColumn={true}
              getRowStyle={(params) => {
                if (params.data?.tipo_mov === 'PAGO') return { borderLeft: '4px solid #10b981' }
                return { borderLeft: '4px solid #f43f5e' }
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
