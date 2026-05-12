'use client'

import { Modal, Spin, Input, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { gananciasApi } from '~/lib/api/ganancias'
import TableWithTitle from '~/components/tables/table-with-title'
import { useMemo, useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { FaMoneyBillWave, FaSearch, FaFilter } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import ButtonBase from '~/components/buttons/button-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'

interface ModalPagosComprasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

const TIPOS_GASTO = [
  { value: 'todos', label: 'Todos los Gastos' },
  { value: 'gasto_operativo', label: 'Gastos Operativos' },
  { value: 'comision_vendedor', label: 'Comisiones Vendedores' },
]

export default function ModalPagosCompras({ open, onClose, filtros: filtrosGlobales }: ModalPagosComprasProps) {
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
    search: '',
    tipo_gasto: 'gasto_operativo',
  })
  const [debouncedSearch] = useDebounce(localFiltros.search, 500)

  useEffect(() => {
    if (open) {
      setLocalFiltros({
        desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
        hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
        search: '',
        tipo_gasto: 'gasto_operativo',
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

  const gastosRaw = data?.data?.data?.gastos || []

  // Filtrar por tipo de gasto
  const gastosFiltrados = useMemo(() => {
    let gastos = gastosRaw
    
    if (localFiltros.tipo_gasto !== 'todos') {
      gastos = gastos.filter((g: any) => g.tipo === localFiltros.tipo_gasto)
    }
    
    return gastos.sort((a: any, b: any) => 
      dayjs(b.created_at || b.fecha).unix() - dayjs(a.created_at || a.fecha).unix()
    )
  }, [gastosRaw, localFiltros.tipo_gasto])

  const totalGastos = useMemo(() =>
    gastosFiltrados.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0),
    [gastosFiltrados]
  )

  // Totales por tipo de gasto
  const totalesPorTipo = useMemo(() => {
    const operativos = gastosRaw.filter((g: any) => g.tipo === 'gasto_operativo')
    const compras = gastosRaw.filter((g: any) => g.tipo === 'gasto_compra')
    const comisiones = gastosRaw.filter((g: any) => g.tipo === 'comision_vendedor')

    return {
      operativos: {
        total: operativos.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0),
        count: operativos.length
      },
      compras: {
        total: compras.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0),
        count: compras.length
      },
      comisiones: {
        total: comisiones.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0),
        count: comisiones.length
      },
      todos: {
        total: gastosRaw.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0),
        count: gastosRaw.length
      }
    }
  }, [gastosRaw])

  const columnas = useMemo<ColDef[]>(() => [
    {
      headerName: 'FECHA',
      field: 'created_at',
      width: 175,
      valueFormatter: (p) => {
        const val = p.value || p.data?.fecha
        return val ? dayjs(val).format('DD/MM/YYYY HH:mm:ss') : '-'
      },
    },
    {
      headerName: 'TIPO',
      field: 'tipo_gasto',
      width: 180,
      cellStyle: (params) => {
        const tipo = params.data?.tipo
        if (tipo === 'gasto_operativo') return { fontWeight: 'bold', color: '#dc2626' }
        if (tipo === 'gasto_compra') return { fontWeight: 'bold', color: '#ea580c' }
        if (tipo === 'comision_vendedor') return { fontWeight: 'bold', color: '#9333ea' }
        return { fontWeight: 'bold', color: '#000000' }
      },
    },
    {
      headerName: 'DESCRIPCIÓN',
      field: 'descripcion',
      flex: 1,
      minWidth: 220,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'MONTO',
      field: 'monto',
      width: 130,
      type: 'numericColumn',
      cellStyle: { fontWeight: 'bold', color: '#dc2626' } as any,
      valueFormatter: (p) => p.value ? `S/ ${Number(p.value).toFixed(2)}` : 'S/ 0.00',
    },
  ], [])

  const pinnedBottomRowData = useMemo(() => {
    if (gastosFiltrados.length === 0) return []
    return [{ 
      tipo_gasto: 'TOTAL:',
      descripcion: `${gastosFiltrados.length} registro(s)`, 
      monto: totalGastos 
    }]
  }, [gastosFiltrados, totalGastos])

  return (
    <Modal
      title="Gastos"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      styles={{ body: { padding: '16px' } }}
    >
      <div className="flex flex-col gap-4">
        {/* Filtros */}
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
          <LabelBase label="Tipo de Gasto" orientation="column" className="!gap-1">
            <Select
              value={localFiltros.tipo_gasto}
              onChange={(value) => setLocalFiltros(prev => ({ ...prev, tipo_gasto: value }))}
              options={TIPOS_GASTO}
              className="!w-[200px]"
              suffixIcon={<FaFilter className="text-slate-400" />}
            />
          </LabelBase>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Buscar</span>
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
            color="danger"
            size="md"
            className="flex items-center gap-2 h-[32px] px-6"
            onClick={() => refetch()}
            loading={isFetching}
          >
            <FaSearch size={12} />
            Buscar
          </ButtonBase>
        </div>

        {/* Cards por tipo de gasto */}
        <div className="grid grid-cols-3 gap-3">
          {/* Card Todos */}
          <div 
            className={`bg-white border rounded-lg p-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              localFiltros.tipo_gasto === 'todos' ? 'border-slate-500 ring-2 ring-slate-200' : 'border-slate-200'
            }`}
            onClick={() => setLocalFiltros(prev => ({ ...prev, tipo_gasto: 'todos' }))}
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                <FaMoneyBillWave size={16} />
              </div>
              <div className="flex-1">
                <div className="text-[9px] uppercase text-slate-500 font-bold">Todos los Gastos</div>
                <div className="text-lg font-bold text-slate-700">S/ {totalesPorTipo.todos.total.toFixed(2)}</div>
                <div className="text-[9px] text-slate-400">{totalesPorTipo.todos.count} registro(s)</div>
              </div>
            </div>
          </div>

          {/* Card Gastos Operativos */}
          <div 
            className={`bg-white border rounded-lg p-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              localFiltros.tipo_gasto === 'gasto_operativo' ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200'
            }`}
            onClick={() => setLocalFiltros(prev => ({ ...prev, tipo_gasto: 'gasto_operativo' }))}
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <FaMoneyBillWave size={16} />
              </div>
              <div className="flex-1">
                <div className="text-[9px] uppercase text-red-600 font-bold">Gastos Operativos</div>
                <div className="text-lg font-bold text-red-700">S/ {totalesPorTipo.operativos.total.toFixed(2)}</div>
                <div className="text-[9px] text-red-400">{totalesPorTipo.operativos.count} registro(s)</div>
              </div>
            </div>
          </div>

          {/* Card Comisiones Vendedores */}
          <div 
            className={`bg-white border rounded-lg p-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              localFiltros.tipo_gasto === 'comision_vendedor' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-200'
            }`}
            onClick={() => setLocalFiltros(prev => ({ ...prev, tipo_gasto: 'comision_vendedor' }))}
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                <FaMoneyBillWave size={16} />
              </div>
              <div className="flex-1">
                <div className="text-[9px] uppercase text-purple-600 font-bold">Comisiones Vendedores</div>
                <div className="text-lg font-bold text-purple-700">S/ {totalesPorTipo.comisiones.total.toFixed(2)}</div>
                <div className="text-[9px] text-purple-400">{totalesPorTipo.comisiones.count} registro(s)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="h-[450px] w-full border border-rose-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-white">
              <Spin size="large" tip="Cargando gastos..." />
            </div>
          ) : (
            <TableWithTitle
              id="table-modal-gastos"
              title="Gastos"
              columnDefs={columnas}
              rowData={gastosFiltrados}
              loading={isLoading}
              pinnedBottomRowData={pinnedBottomRowData}
              headerColor="#dc2626"
              selectionColor="#fef2f2"
              withNumberColumn={true}
              getRowStyle={(params) => {
                const tipo = params.data?.tipo
                if (tipo === 'gasto_operativo') return { borderLeft: '3px solid #dc2626' }
                if (tipo === 'gasto_compra') return { borderLeft: '3px solid #ea580c' }
                if (tipo === 'comision_vendedor') return { borderLeft: '3px solid #9333ea' }
                return { borderLeft: '3px solid #fca5a5' }
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
